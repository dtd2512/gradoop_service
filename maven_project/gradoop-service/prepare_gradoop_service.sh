## moves some test data to the gradoop_service data folder
sudo mkdir -p /var/gradoop_service/
sudo chmod 777 /var/gradoop_service/
sudo cp -r src/main/resources/data/* /var/gradoop_service
