import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: {
    id: string
    shop_id: string
    client_phone: string | null
    client_name: string | null
    status: string
  }
  old_record: {
    status: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WebhookPayload = await req.json()
    console.log('Received webhook:', JSON.stringify(payload))

    // Only process when appointment becomes completed
    if (
      payload.type === 'UPDATE' &&
      payload.table === 'appointments' &&
      payload.record.status === 'completed' &&
      payload.old_record.status !== 'completed' &&
      payload.record.client_phone
    ) {
      const { shop_id, client_phone, client_name } = payload.record
      const pointsToAward = 10

      console.log(`Awarding ${pointsToAward} points to ${client_phone} at shop ${shop_id}`)

      // Check if client already has points record
      const { data: existingPoints } = await supabase
        .from('loyalty_points')
        .select('id, total_points, lifetime_points, client_name')
        .eq('shop_id', shop_id)
        .eq('client_phone', client_phone)
        .maybeSingle()

      if (existingPoints) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({
            total_points: existingPoints.total_points + pointsToAward,
            lifetime_points: existingPoints.lifetime_points + pointsToAward,
            client_name: client_name || existingPoints.client_name,
          })
          .eq('id', existingPoints.id)

        if (updateError) {
          console.error('Error updating points:', updateError)
          throw updateError
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            shop_id,
            client_phone,
            client_name,
            total_points: pointsToAward,
            lifetime_points: pointsToAward,
          })

        if (insertError) {
          console.error('Error creating points record:', insertError)
          throw insertError
        }
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id,
          client_phone,
          appointment_id: payload.record.id,
          points_change: pointsToAward,
          description: 'Pontos ganhos por atendimento completado',
        })

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
        throw transactionError
      }

      console.log(`Successfully awarded ${pointsToAward} points to ${client_phone}`)

      return new Response(
        JSON.stringify({ success: true, points_awarded: pointsToAward }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'No action needed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in award-loyalty-points:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
