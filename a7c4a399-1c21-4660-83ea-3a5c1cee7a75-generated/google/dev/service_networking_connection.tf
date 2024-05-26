resource "google_service_networking_connection" "tfer--me-env-back-end-0" {
  network                 = "projects/me-env/global/networks/default"
  reserved_peering_ranges = ["${google_compute_global_address.tfer--me-env-backendvpcpeering-0.name}"]
  service                 = "servicenetworking.googleapis.com"
}
