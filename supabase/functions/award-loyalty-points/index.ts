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

      let newTotalPoints = pointsToAward

      if (existingPoints) {
        // Update existing record
        newTotalPoints = existingPoints.total_points + pointsToAward
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({
            total_points: newTotalPoints,
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

      // Check if client now has enough points for any rewards
      const { data: availableRewards } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('shop_id', shop_id)
        .eq('is_active', true)
        .lte('points_required', newTotalPoints)
        .order('points_required', { ascending: true })
        .limit(1)

      // Send WhatsApp notification if rewards are available
      if (availableRewards && availableRewards.length > 0) {
        const reward = availableRewards[0]
        
        // Get shop W-API credentials
        const { data: shop } = await supabase
          .from('shops')
          .select('wapi_instance_id, wapi_token, name')
          .eq('id', shop_id)
          .single()

        if (shop?.wapi_instance_id && shop?.wapi_token) {
          const discount = reward.discount_percentage 
            ? `${reward.discount_percentage}% de desconto`
            : `R$ ${Number(reward.discount_amount).toFixed(2)} de desconto`

          const message = `🎉 *Parabéns!* Você acumulou *${newTotalPoints} pontos* na ${shop.name}!\n\n` +
            `Você já pode resgatar a recompensa:\n` +
            `*${reward.title}* - ${discount}\n\n` +
            `Necessário: ${reward.points_required} pontos ✨\n\n` +
            `Entre no sistema e resgate sua recompensa! 🎁`

          try {
            const wapiResponse = await fetch(
              `https://api.wapi.ws/v1/instance${shop.wapi_instance_id}/client/action/send-message`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${shop.wapi_token}`,
                },
                body: JSON.stringify({
                  chatId: `${client_phone}@c.us`,
                  message,
                }),
              }
            )

            if (!wapiResponse.ok) {
              console.error('Failed to send WhatsApp notification:', await wapiResponse.text())
            } else {
              console.log(`WhatsApp notification sent to ${client_phone} about available reward`)
            }
          } catch (error) {
            console.error('Error sending WhatsApp notification:', error)
            // Don't throw - notification is optional
          }
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

      console.log(`Successfully awarded ${pointsToAward} points to ${client_phone}. New total: ${newTotalPoints}`)

      return new Response(
        JSON.stringify({ success: true, points_awarded: pointsToAward, new_total: newTotalPoints }),
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
