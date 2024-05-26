resource "google_sql_database_instance" "tfer--me-env-back-end-instance-asia-southeast2-0" {
  database_version = "MYSQL_5_7"
  name             = "back-end-instance"
  project          = "me-env"
  region           = "asia-southeast2"

  settings {
    ip_configuration {
      ipv4_enabled    = "false"
      private_network = "projects/me-env/global/networks/default"
      require_ssl     = "false"
    }

    tier = "backend"
  }
}
