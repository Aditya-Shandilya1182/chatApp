#!/bin/bash

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply services
kubectl apply -f k8s/auth-service/
kubectl apply -f k8s/user-service/
kubectl apply -f k8s/message-service/
kubectl apply -f k8s/ws-service/
kubectl apply -f k8s/proxy/

echo "Deployment completed."
