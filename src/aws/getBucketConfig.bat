@echo off

if "%1"=="" (
    echo Please provide a parameter.
    exit /b 1
)

set BUCKET_NAME=%1

echo The provided parameter is: %BUCKET_NAME%

aws s3api get-bucket-acl --bucket %BUCKET_NAME%
aws s3api get-bucket-cors --bucket %BUCKET_NAME%
aws s3api get-bucket-lifecycle-configuration --bucket %BUCKET_NAME%
aws s3api get-bucket-logging --bucket %BUCKET_NAME%
aws s3api get-bucket-policy --bucket %BUCKET_NAME%
aws s3api get-bucket-replication --bucket %BUCKET_NAME%
aws s3api get-bucket-request-payment --bucket %BUCKET_NAME%
aws s3api get-bucket-versioning --bucket %BUCKET_NAME%
aws s3api get-bucket-website --bucket %BUCKET_NAME%
aws s3api get-bucket-encryption --bucket %BUCKET_NAME%
aws s3api get-public-access-block --bucket %BUCKET_NAME%
aws s3api get-object-lock-configuration --bucket %BUCKET_NAME%