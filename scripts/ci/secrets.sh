#!/bin/bash
echo "Generating fly secrets."

cat > .fly.secrets.yml <<EOL
aws_s3_access_key_id: ${AWS_S3_ACCESS_KEY_ID}
aws_s3_secret_access_key: ${AWS_S3_SECRET_ACCESS_KEY}
EOL