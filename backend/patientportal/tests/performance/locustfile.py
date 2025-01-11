from locust import HttpUser, task, between, events
import random
import logging


class MedicalSystemUser(HttpUser):
    wait_time = between(1, 3)  # Wait between 1-3 seconds between tasks
    token = None
    assignee_ids = []  # Cache assignee IDs for reuse

    def on_start(self):
        """Login at start and store the token"""
        response = self.client.post(
            "/api/v1/auth/login",
            data={
                "username": "admin",
                "password": "admin"
            }
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.load_assignee_ids()
        else:
            logging.error("Login failed. Unable to retrieve token.")

    def load_assignee_ids(self):
        """Fetch existing assignees and cache their IDs"""
        response = self.client.get(
            "/api/v1/assignees/",
            headers=self.headers,
            name="/assignees - GET List"
        )
        if response.status_code == 200:
            assignees = response.json().get("results", [])
            self.assignee_ids = [assignee["id"] for assignee in assignees]
            logging.info(f"Loaded {len(self.assignee_ids)} assignee IDs.")
        else:
            logging.error(f"Failed to fetch assignees: {response.text}")

    @task(3)
    def view_requests(self):
        """High frequency task - viewing requests"""
        with self.client.get(
            "/api/v1/requests/",
            headers=self.headers,
            name="/requests - GET List"
        ) as response:
            if response.status_code == 200:
                requests = response.json()["results"]
                if requests:
                    request_id = random.choice(requests)["id"]
                    self.client.get(
                        f"/api/v1/requests/{request_id}",
                        headers=self.headers,
                        name="/requests/{id} - GET Detail"
                    )
            else:
                logging.error(f"Failed to retrieve request list: {response.text}")

    @task(2)
    def create_request(self):
        """Medium frequency task - creating new requests"""
        national_id = random.randint(1000000000, 9999999999)
        medical_number = random.randint(1000000, 9999999)
        with self.client.post(
            "/api/v1/requests/",
            headers=self.headers,
            json={
                "full_name": f"Test User {national_id}",
                "national_id": national_id,
                "medical_number": medical_number
            },
            name="/requests - POST Create"
        ) as response:
            if response.status_code != 200:
                logging.error(f"Failed to create request: {response.text}")

    @task(1)
    def update_request(self):
        """Low frequency task - updating a request"""
        if not self.assignee_ids:
            logging.error("No assignees available to assign. Skipping update_request.")
            return

        # Step 1: Create a new request
        national_id = random.randint(1000000000, 9999999999)
        initial_data = {
            "full_name": f"Test User {national_id}",
            "national_id": national_id,
            "medical_number": random.randint(1000000, 9999999)
        }
        create_response = self.client.post(
            "/api/v1/requests/",
            json=initial_data,
            headers=self.headers,
            name="/requests - POST Create (for Update)"
        )
        
        if create_response.status_code == 200:
            request_id = create_response.json()["id"]
            
            # Step 2: Update the created request with a valid assignee
            update_data = {
                "medical_number": random.randint(1111111, 9999999),
                "notes": "Updated notes",
                "assigned_to": random.choice(self.assignee_ids)
            }
            with self.client.put(
                f"/api/v1/requests/{request_id}",
                json=update_data,
                headers=self.headers,
                name="/requests/{id} - PUT Update"
            ) as update_response:
                if update_response.status_code != 200:
                    logging.error(f"Failed to update request {request_id}: {update_response.text}")
        else:
            logging.error(f"Failed to create request for update: {create_response.text}")

    @task(2)
    def create_assignee(self):
        """Medium frequency task - creating assignees"""
        full_name = f"Assignee {random.randint(1, 1000)}"
        with self.client.post(
            "/api/v1/assignees/",
            headers=self.headers,
            json={"full_name": full_name},
            name="/assignees - POST Create"
        ) as response:
            if response.status_code == 200:
                assignee_id = response.json()["id"]
                self.assignee_ids.append(assignee_id)
                logging.info(f"Created new assignee with ID {assignee_id}.")
            else:
                logging.error(f"Failed to create assignee: {response.text}")

    def on_stop(self):
        """Cleanup when the test stops"""
        logging.info("Test execution completed.")


# Custom hook to log request successes and failures
@events.request.add_listener
def log_request(request_type, name, response_time, response_length, response=None, exception=None, **kwargs):
    if exception:
        logging.error(f"Failure: {request_type} {name} - {response_time}ms - {str(exception)}")
    else:
        logging.info(f"Success: {request_type} {name} - {response_time}ms - {response_length} bytes")
