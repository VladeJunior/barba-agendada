import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AcceptInviteRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { token }: AcceptInviteRequest = await req.json();

    if (!token) {
      throw new Error("Token is required");
    }

    console.log("Accepting invite with token:", token, "for user:", user.id);

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("barber_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation not found:", inviteError);
      throw new Error("Invitation not found");
    }

    if (invitation.status === "accepted") {
      return new Response(
        JSON.stringify({ success: false, reason: "Invitation already accepted" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, reason: "Invitation expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update barber with user_id using service role
    const { error: barberError } = await supabase
      .from("barbers")
      .update({ user_id: user.id })
      .eq("id", invitation.barber_id);

    if (barberError) {
      console.error("Error updating barber:", barberError);
      throw new Error("Failed to update barber");
    }

    console.log("Updated barber", invitation.barber_id, "with user_id", user.id);

    // Check if user_roles entry already exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("shop_id", invitation.shop_id)
      .eq("role", "barber")
      .single();

    if (!existingRole) {
      // Create user_roles entry
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          shop_id: invitation.shop_id,
          role: "barber",
        });

      if (roleError) {
        console.error("Error creating role:", roleError);
        // Don't throw, role might already exist
      } else {
        console.log("Created barber role for user", user.id);
      }
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from("barber_invitations")
      .update({ 
        status: "accepted",
        accepted_at: new Date().toISOString()
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
    }

    console.log("Invitation accepted successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in accept-barber-invite:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
