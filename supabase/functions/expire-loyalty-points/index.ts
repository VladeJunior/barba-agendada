import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting loyalty points expiration check...')
    
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Find points expiring in the next 30 days (for warnings)
    const { data: expiringPoints, error: expiringError } = await supabase
      .from('loyalty_points')
      .select('*, shops(name, wapi_instance_id, wapi_token)')
      .not('points_expire_at', 'is', null)
      .gte('points_expire_at', now.toISOString())
      .lte('points_expire_at', thirtyDaysFromNow.toISOString())
      .gt('total_points', 0)

    if (expiringError) {
      console.error('Error fetching expiring points:', expiringError)
      throw expiringError
    }

    console.log(`Found ${expiringPoints?.length || 0} clients with points expiring soon`)

    // Send warnings for expiring points
    let warningsSent = 0
    for (const pointsRecord of expiringPoints || []) {
      const shop = pointsRecord.shops as any
      if (!shop?.wapi_instance_id || !shop?.wapi_token) {
        console.log(`Skipping ${pointsRecord.client_phone} - shop has no W-API configured`)
        continue
      }

      const expireDate = new Date(pointsRecord.points_expire_at)
      const daysUntilExpire = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const message = `⚠️ *Atenção!* Seus pontos na ${shop.name} estão prestes a expirar!\n\n` +
        `Você possui *${pointsRecord.total_points} pontos* que expirarão em *${daysUntilExpire} dias* (${expireDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}).\n\n` +
        `💡 Resgate suas recompensas antes que expire! Acesse o sistema e aproveite seus pontos. 🎁`

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
              chatId: `${pointsRecord.client_phone}@c.us`,
              message,
            }),
          }
        )

        if (wapiResponse.ok) {
          warningsSent++
          console.log(`Warning sent to ${pointsRecord.client_phone}`)
        } else {
          console.error(`Failed to send warning to ${pointsRecord.client_phone}:`, await wapiResponse.text())
        }
      } catch (error) {
        console.error(`Error sending warning to ${pointsRecord.client_phone}:`, error)
      }
    }

    // Find and expire points that have passed their expiration date
    const { data: expiredPoints, error: expiredError } = await supabase
      .from('loyalty_points')
      .select('*')
      .not('points_expire_at', 'is', null)
      .lt('points_expire_at', now.toISOString())
      .gt('total_points', 0)

    if (expiredError) {
      console.error('Error fetching expired points:', expiredError)
      throw expiredError
    }

    console.log(`Found ${expiredPoints?.length || 0} clients with expired points`)

    // Expire points and create transaction records
    let pointsExpired = 0
    for (const pointsRecord of expiredPoints || []) {
      const pointsToExpire = pointsRecord.total_points

      // Update points to 0
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          total_points: 0,
          points_expire_at: null,
        })
        .eq('id', pointsRecord.id)

      if (updateError) {
        console.error(`Error expiring points for ${pointsRecord.client_phone}:`, updateError)
        continue
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: pointsRecord.shop_id,
          client_phone: pointsRecord.client_phone,
          points_change: -pointsToExpire,
          description: 'Pontos expirados por falta de uso',
        })

      if (transactionError) {
        console.error(`Error creating expiration transaction for ${pointsRecord.client_phone}:`, transactionError)
        continue
      }

      pointsExpired++
      console.log(`Expired ${pointsToExpire} points for ${pointsRecord.client_phone}`)
    }

    const summary = {
      warnings_sent: warningsSent,
      points_expired: pointsExpired,
      timestamp: now.toISOString(),
    }

    console.log('Expiration check completed:', summary)

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in expire-loyalty-points:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
