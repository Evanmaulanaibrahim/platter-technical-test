# Platter Technical Test

aplikasi yang dibuat untuk memenuhi technical test, dengan menggunakan 
rabbitMQ, postgreSQL dan Docker.

## Daftar Isi

- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Service](#struktur-service)
    - [RabbitMQ](#rabbitmq)

## Prasyarat

Sebelum menjalankan aplikasi ini, pastikan Anda memiliki:
- [Docker](https://www.docker.com/get-started) terinstal.
- [Docker Compose](https://docs.docker.com/compose/install/) terinstal.

## Instalasi

1. Clone repository ini ke mesin lokal Anda:
   ```bash
   git clone https://github.com/Evanmaulanaibrahim/platter-technical-test.git
   cd platter-technical-test
   npm install

2. Buat file .env di root folder dan sesuaikan dengan kebutuhan Anda

## Menjalankan Aplikasi

1. Untuk menjalankan aplikasi, gunakan perintah berikut:
    ```bash
    docker-compose up
   ```

    Perintah ini akan membangun dan menjalankan semua service yang terdefinisi di dalam file docker-compose.yml. Untuk menjalankan dalam mode latar belakang, Anda bisa menambahkan flag -d:
    ```bash
    docker-compose up -d
    ```
