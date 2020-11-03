#!/bin/bash

set -euo pipefail

function configure_vsftpd(){
  local pasv_address

  if [ "${FTP_RESOLVE_PUBLIC_IP:-false}" == true ]; then
    pasv_address=$(dig @resolver1.opendns.com ANY myip.opendns.com +short)
  else
    pasv_address=$(/sbin/ip route|awk '/default/ { print $3 }')
  fi

  {
    echo "# IP conf generated at runtime";
    echo "pasv_address=${pasv_address}"
  } >> /etc/vsftpd/vsftpd.conf

  if [ "${FTP_SSL_ENABLE:-false}" == true ]; then
  {
    echo "# SSL conf generated at runtime";
    echo "ssl_enable=YES";
    echo "rsa_cert_file=${FTP_RSA_CERT_FILE}";
    echo "rsa_private_key_file=${FTP_RSA_PRIVATE_KEY_FILE}";
    echo "allow_anon_ssl=NO";
    echo "force_local_data_ssl=YES";
    echo "force_local_logins_ssl=YES";
    echo "ssl_tlsv1=YES";
    echo "ssl_sslv2=NO";
    echo "ssl_sslv3=NO";
    echo "require_ssl_reuse=NO";
    echo "ssl_ciphers=HIGH"
    } >> /etc/vsftpd/vsftpd.conf
  fi

  mkdir -p /data/users
  chown -R virtual:virtual /data/users
  mkdir -p /data/vsftpd_user_conf
  touch /data/ftp.log
}

function configure_pam(){
  touch /data/vsftpd_pam

  {
    echo "# Generated at runtime";
    echo "auth    required pam_pwdfile.so pwdfile=/data/vsftpd_pam";
    echo "account required pam_permit.so"
  } > /etc/pam.d/vsftpd
}

configure_vsftpd
configure_pam

echo "Starting vsftp server..."
/usr/sbin/vsftpd /etc/vsftpd/vsftpd.conf &
tail -f /data/ftp.log
