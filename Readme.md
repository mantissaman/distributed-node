# Instructions to create keys
## Happens once for the CA
``` 
$ openssl genrsa -des3 -out ca-private-key.key 2048
$ openssl req -x509 -new -nodes -key ca-private-key.key \
  -sha256 -days 365 -out shared/tls/ca-certificate.cert
```

## Happens for each new certificate
```
$ openssl genrsa -out recipe-api/tls/producer-private-key.key 2048 
$ openssl req -new -key recipe-api/tls/producer-private-key.key \
  -out recipe-api/tls/producer.csr 
$ openssl x509 -req -in recipe-api/tls/producer.csr \
  -CA shared/tls/ca-certificate.cert \
  -CAkey ca-private-key.key -CAcreateserial \
  -out shared/tls/producer-certificate.cert -days 365 -sha256
```