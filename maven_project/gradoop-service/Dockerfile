FROM scads/gradoop-service-ci

EXPOSE 2342 
#EXPOSE 8080
WORKDIR /gradoop-web-backend
ADD . ./
RUN mvn --batch-mode clean package
CMD java -jar target/gradoop-service-*-SNAPSHOT.jar --uri http://$(hostname -i)/gradoop-service/ --localMode
