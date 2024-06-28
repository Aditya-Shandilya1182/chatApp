# Use official nginx image as base
FROM nginx:latest

# Copy nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/gateway.conf

# Remove default nginx configurations
RUN rm -f /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# CMD to start nginx
CMD ["nginx", "-g", "daemon off;"]
