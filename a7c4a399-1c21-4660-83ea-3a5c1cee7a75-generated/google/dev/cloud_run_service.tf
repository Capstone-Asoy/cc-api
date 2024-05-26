resource "google_cloud_run_service" "tfer--me-env-asia-southeast2-ml-model-0" {
  location = "asia-southeast2"
  name     = "ml-model"
  project  = "me-env"
}
