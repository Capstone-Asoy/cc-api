provider "google" {
  project = ""
}

terraform {
	required_providers {
		google = {
	    version = "~> 4.33.0"
		}
  }
}
