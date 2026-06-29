# SES for Cognito email (Phase 3). See docs/admin-auth/phase-3-ses-email.md
#
# Rollout:
#   1. Apply with cognito_use_ses_email = false (default) — creates SES identity + outputs DNS records
#   2. Add DNS records in Cloudflare from terraform output
#   3. Wait for SES domain status = Verified
#   4. Set cognito_use_ses_email = true and apply again
#   5. Request SES production access in the AWS console

# ses_domain            = "bonaetech.com"
# cognito_from_email    = "noreply@bonaetech.com"
# cognito_use_ses_email = true
