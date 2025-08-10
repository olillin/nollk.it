#!/bin/bash
sleep 5
echo "Waiting for MongoDB instances to be reachable..."
until mongosh --host mongo:27017 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do sleep 2; done
until mongosh --host mongo2:27017 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do sleep 2; done
until mongosh --host mongo3:27017 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do sleep 2; done

echo "Initiating replica set..."
mongosh --host mongo:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
EOF
