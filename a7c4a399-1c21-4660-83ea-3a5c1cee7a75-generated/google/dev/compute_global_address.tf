resource "google_compute_global_address" "tfer--me-env-backendvpcpeering-0" {
  address_type  = "INTERNAL"
  name          = "backendvpcpeering"
  network       = "projects/me-env/global/networks/default"
  prefix_length = "24"
  project       = "me-env"
  purpose       = "VPC_PEERING"
}
