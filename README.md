# Backend API BookMate

This is an API backend project deployed using Google App Engine, using Cloud SQL as the database, and Cloud Storage as the object storage.

## Fitur

- **CRUD API**: Implementasi Create, Read, Update, dan Delete untuk berbagai entitas.
- **Integrasi dengan Cloud SQL**: Menggunakan Google Cloud SQL untuk penyimpanan data yang terstruktur.
- **Penyimpanan objek dengan Cloud Storage**: Penyimpanan dan pengambilan objek dari Google Cloud Storage.
- **Autentikasi**: Sistem autentikasi pengguna.

## Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) terinstal di komputer.
- The Google Cloud project has been created.
- Cloud SQL and Cloud Storage are already set up in your Google Cloud project.

## Instalasi

1. Clone repositori ini:

    ```sh
    git clone https://github.com/username/repository.git
    cd repository
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
    runtime: nodejs20
    instance_class: F1
    env_variables:
      DB_HOST: <CLOUD_SQL_INSTANCE_IP>
      DB_USER: <DATABASE_USER>
      DB_PASSWORD: <DATABASE_PASSWORD>
      DB_NAME: <DATABASE_NAME>
      GCLOUD_PROJECT: <PROJECT_ID>
      GCLOUD_STORAGE_BUCKET: <BUCKET_NAME>
    automatic_scaling:
      target_cpu_utilization: 0.65
      min_instances: 1
      max_instances: 3
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
