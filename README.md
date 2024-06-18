# Backend API BookMate

This is an API backend project deployed using Google App Engine, using Cloud SQL as the database, and Cloud Storage as the object storage.

## Fitur

- **CRUD API**: Implementasi Create, Read, Update, dan Delete.
- **Integrasi dengan Cloud SQL**: Menggunakan Google Cloud SQL untuk penyimpanan data yang terstruktur.
- **App Engine**: Menggunakan Google App Engine untuk deploy Back-End.
- **Cloud Run**: Menggunakan Google Cloud Run untuk deploy container machine learning, memungkinkan pemrosesan model yang efisien dan skalabel.
- **Penyimpanan objek dengan Cloud Storage**: Penyimpanan dan pengambilan objek dari Google Cloud Storage.
- **Penyimpanan rekomendasi dengan Cloud firestore**: Penyimpanan dan pengambilan hasil rekomendasi dengan Google Cloud Firestore.
- **Autentikasi**: Sistem autentikasi pengguna.

## Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed on the computer.
- The Google Cloud project has been created.
- Cloud SQL, Cloud Firestore and Cloud Storage are already set up in your Google Cloud project.

## Instalasi

1. Clone repositori ini:

    ```sh
    git clone https://github.com/Capstone-Asoy/cc-api.git
    cd cc-api
    ```

2. Instal dependensi:

    ```sh
    npm install
    ```

    atau menggunakan `yarn`:

    ```sh
    yarn install
    ```

## Konfigurasi

1. Configure environment variables directly in the file `app.yaml`:

    ```yaml
    runtime: nodejs18
    instance_class: F1
    service: default

    handlers:
    - url: /.*
    script: auto

    readiness_check:
    path: "/readiness_check"
    check_interval_sec: 5
    timeout_sec: 4
    failure_threshold: 2
    success_threshold: 2
    app_start_timeout_sec: 300
    ```

## Menjalankan Aplikasi

To run the application with localhost:

1. Jalankan:

    ```sh
    npm start
    ```

    atau menggunakan `yarn`:

    ```sh
    yarn start
    ```

The app now runs on `http://localhost:port`.

## Deploy ke Google App Engine

1. Deploy aplikasi ke App Engine:

    ```sh
    gcloud app deploy
    ```

2. Buka aplikasi yang telah di-deploy:

    ```sh
    gcloud app browse
    ```
