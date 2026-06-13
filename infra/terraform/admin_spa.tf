resource "aws_s3_bucket" "admin_spa" {
  bucket = "bonae-admin-spa-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "admin_spa" {
  bucket = aws_s3_bucket.admin_spa.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "admin_spa" {
  name                              = "bonae-admin-spa-oac"
  description                       = "Origin access control for admin SPA S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "admin_spa" {
  enabled             = true
  default_root_object = "index.html"
  http_version        = "http2"
  price_class         = "PriceClass_100"
  comment             = "BONAE admin SPA"

  origin {
    domain_name              = aws_s3_bucket.admin_spa.bucket_regional_domain_name
    origin_id                = "AdminS3Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.admin_spa.id
  }

  default_cache_behavior {
    target_origin_id       = "AdminS3Origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    # AWS managed CachingOptimized policy
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # SPA routing: let React Router handle 404s by returning index.html
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "admin_spa" {
  # Ensure public access block is applied before attaching the policy
  depends_on = [aws_s3_bucket_public_access_block.admin_spa]
  bucket     = aws_s3_bucket.admin_spa.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.admin_spa.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.admin_spa.arn
        }
      }
    }]
  })
}
