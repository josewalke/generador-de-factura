// Buscar específicamente el patrón que vimos en la salida real
const salidaReal = `My "Personal"


0003:    30 08                                  ; SEQUENCE (8 bytes)
0005:    |  06 06                               ; OBJECT_ID (6 bytes)
0007:    |     04 00 8e 46 01 014  00 8e 46 01 01 30 13 06   0..0......F..0..
         |        ; 0.4.0.1862.1.1 Certificado calificado europeo
000d:    30 13                                  ; SEQUENCE (13 bytes)
000f:    |  06 06                               ; OBJECT_ID (6 bytes)
0011:    |  |  04 00 8e 46 01 06
         |  |     ; 0.4.0.1862.1.6
0017:    |  30 09                               ; SEQUENCE (9 bytes)
0019:    |     06 07                            ; OBJECT_ID (7 bytes)
001b:    |        04 00 8e 46 01 06 01
         |           ; 0.4.0.1862.1.6.1
0022:    30 68                                  ; SEQUENCE (68 bytes)
0024:    |  06 06                               ; OBJECT_ID (6 bytes)
0026:    |  |  04 00 8e 46 01 05
         |  |     ; 0.4.0.1862.1.5
002c:    |  30 5e                               ; SEQUENCE (5e bytes)
002e:    |     30 2d                            ; SEQUENCE (2d bytes)
0030:    |     |  16 27                         ; IA5_STRING (27 bytes)
0032:    |     |  |  68 74 74 70 73 3a 2f 2f  77 77 77 2e 63 65 72 74  ; https://www.cert
0042:    |     |  |  2e 66 6e 6d 74 2e 65 73  2f 70 64 73 2f 50 44 53  ; .fnmt.es/pds/PDS
0052:    |     |  |  5f 65 73 2e 70 64 66                              ; _es.pdf
         |  |  |     ; "https://www.cert.fnmt.es/pds/PDS_es.pdf"
0059:    |     |  13 02                         ; PRINTABLE_STRING (2 bytes)
005b:    |     |     65 73                                             ; es
         |     |        ; "es"
005d:    |     30 2d                            ; SEQUENCE (2d bytes)
005f:    |        16 27                         ; IA5_STRING (27 bytes)
0061:    |        |  68 74 74 70 73 3a 2f 2f  77 77 77 2e 63 65 72 74  ; https://www.cert
0071:    |        |  2e 66 6e 6d 74 2e 65 73  2f 70 64 73 2f 50 44 53  ; .fnmt.es/pds/PDS
0081:    |        |  5f 65 6e 2e 70 64 66                              ; _en.pdf
         |        |     ; "https://www.cert.fnmt.es/pds/PDS_en.pdf"
0088:    |        13 02                         ; PRINTABLE_STRING (2 bytes)
008a:    |           65 6e                                             ; en
         |              ; "en"
008c:    30 0b                                  ; SEQUENCE (b bytes)
008e:       06 06                               ; OBJECT_ID (6 bytes)                                      ctclass=cRLDistributionPoint)resentacion,OU=CERES,O=FNMT-RCM,C=ES?certificateRevocationList;binary?base?objec
                       Dirección URL=http://www.cert.fnmt.es/crlsrep/CRL2765.crl
0096:       02 01                               ; INTEGER (1 bytes)
Algoritmo de firma:
    Id. de objeto del algoritmo: 1.2.840.113549.1.1.11 sha256RSA
    Parámetros de algoritmo:ongitud = 18
    05 00ificador de clave de entidad emisora
Firma: BitsNoUsados=0dc50969fd73189c911e4ef965ff65f8252466253
    0000  d9 a7 c4 37 d1 49 0a 8c  f5 91 99 38 94 45 86 aa
    0010  5e a5 51 36 e0 e7 7f c3  94 e3 92 48 6a 30 77 31
    0020  55 c4 c8 94 43 ce 29 59  04 5d ec d1 0a 08 c5 b2
    0030  31 44 73 1d 6d 87 0b 17  bb 99 e0 6d b1 b3 67 ed
    0061  b2 61 2b 66 3e 24 e7 08 6e  54 aa 3d aa 05 d6 5a cc
    0050  e9 99 4c 23 ff 18 52 79  bd b2 b2 c1 d4 f0 43 89
    Proveedor = Microsoft Enhanced Cryptographic Provider v1.0es/CN=CRL2765,OU=AC Representacion,OU=CERES,O=
    Tipo de proveedor = 16341a0b857738d9fa1c4b96730c644c989dad633455d55ebdb17c0a00c1dde83c4bd5
  Marcas = 0(sha256): dc7c3df5c545d95e228b2226671d9deb00fe77e11b295a00875b17b66d262f86
    Especificación de clave = 1 -- AT_KEYEXCHANGE3ab9875f8dcc9451b8f5c8859a5644d93b20b7262baadefbe7ee8      
    00a0  33 c5 db 52 a2 3a e3 c6  23 09 b1 fa e0 63 97 10
  CERT_SUBJECT_PUB_KEY_BIT_LENGTH_PROP_ID(92): c5 7e 08 c0
    0x00000800 (2048)808ba00f3c0d3831 0a 59 94 56 93 ea da
    00d0  6c e6 c6 a8 49 7b 6e 1d  85 b8 c5 0d ce 0f bb 24
  CERT_SIGNATURE_HASH_PROP_ID(15) disallowedHash: ff 79 fc
 72c89d52ca18ebbf4417f14ce18c56e49e3ab9875f8dcc9451b8f5c8859a5644
  Nombre de contenedor exclusivo: d72ae6d3560b2e24d3fbe1fc3a816e44_caabdf74-6fe2-47d3-a3ea-f1f1ca13972a     
  CERT_KEY_IDENTIFIER_PROP_ID(20):7a877c24ac5495de08604f9acf6cac0c2b0e3f
    307a877c24ac5495de08604f9acf6cac0c2b0e3f27027643e9a73666524598b4
Hash de Id. de clave(bcrypt-sha1): 5b71cde046e070211c9933c6c02adf447911e227
  CERT_SHA1_HASH_PROP_ID(3):sha256): ea98efa577a787b456d4fb58ad4e39dc0c1808cf4c323b21f021b63ab13ca7cf       
    419586341a0b857738d9fa1c4b96730c644c989d

  CERT_SHA256_HASH_PROP_ID(107):
 dc7c3df5c545d95e228b2226671d9deb00fe77e11b295a00875b17b66d262f86

  CERT_SUBJECT_PUBLIC_KEY_MD5_HASH_PROP_ID(25):
  RSA2a6ef3961375e2fc7ab90e7e309310e
  PP_KEYSTORAGE = 1
    CRYPT_SEC_DESCR -- 1_MD5_HASH_PROP_ID(24):
  KP_PERMISSIONS = 3f (63)97ecb98ff7
    CRYPT_ENCRYPT -- 1
    CRYPT_DECRYPT -- 2ROP_ID(11):
    CRYPT_EXPORT -- 4AN_PEREZ__R:_B35707512_
    CRYPT_READ -- 8
    CRYPT_WRITE -- 10 (16)D(14):
    CRYPT_MAC -- 20 (32)
    CERT_ACCESS_STATE_SYSTEM_STORE_FLAG -- 2
  D:(A;ID;GAGR;;;SY)(A;ID;GAGR;;;BA)(A;ID;GAGR;;;S-1-5-21-2623633372-2746227547-3354511330-1001)
  Proveedor = Microsoft Enhanced Cryptographic Provider v1.0
    Permitir Control total      NT AUTHORITY\\SYSTEM
    Permitir Control total      BUILTIN\\Administradores1fc3a816e44_caabdf74-6fe2-47d3-a3ea-f1f1ca13972a     
    Permitir Control total      JOSE\\Usuario


Clave privada:
  PRIVATEKEYBLOB
  Versión: 2
  aiKeyAlg: 0xa400
    CALG_RSA_KEYX
    Clase de algoritmo: 0xa000(5) ALG_CLASS_KEY_EXCHANGE
    Tipo de algoritmo: 0x400(2) ALG_TYPE_RSA
    Sub Id. de algoritmo: 0x0(0) ALG_SID_RSA_ANY
  0000  52 53 41 32                                        RSA2
  0000  ...
  048c
Prueba de cifrado correcta
CertUtil: -store comando completado correctamente.`;

// Buscar específicamente el patrón JUAN PEREZ
const lines = salidaReal.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
    const linea = lines[i];
    if (linea.includes('JUAN PEREZ')) {
        console.log('Línea encontrada:', linea);
        console.log('Índice:', i);
    }
    if (linea.includes('CN=')) {
        console.log('CN encontrado:', linea);
    }
}
