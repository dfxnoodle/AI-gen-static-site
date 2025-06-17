#!/usr/bin/env python3
"""
Simple HTTP server to serve the AI-generated static site at /ai-gen-static path
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse, unquote
import mimetypes

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        self.directory = "/home/dinochlai/AI-gen-static-site"
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for remote access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Parse the URL path
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)
        
        # Handle health check
        if path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'healthy\n')
            return
        
        # Handle root redirect
        if path == '/':
            self.send_response(301)
            self.send_header('Location', '/ai-gen-static/')
            self.end_headers()
            return
        
        # Handle /ai-gen-static paths
        if path.startswith('/ai-gen-static'):
            # Remove the /ai-gen-static prefix
            file_path = path[len('/ai-gen-static'):]
            if file_path == '' or file_path == '/':
                file_path = '/index.html'
        else:
            # For other paths, treat them as direct file requests
            # This allows relative links in the HTML to work
            file_path = path
        
        # Construct the full file path
        full_path = os.path.join(self.directory, file_path.lstrip('/'))
        
        # Check if file exists
        if os.path.exists(full_path) and os.path.isfile(full_path):
            # Serve the file
            try:
                with open(full_path, 'rb') as f:
                    content = f.read()
                
                # Set the correct content type
                content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
                
                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.send_header('Content-Length', str(len(content)))
                
                # Add security headers
                self.send_header('X-Content-Type-Options', 'nosniff')
                self.send_header('X-Frame-Options', 'DENY')
                self.send_header('X-XSS-Protection', '1; mode=block')
                
                # Add cache headers for static assets
                if file_path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg')):
                    self.send_header('Cache-Control', 'public, max-age=31536000')
                
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as e:
                print(f"Error serving file {full_path}: {e}")
        
        # File not found - serve index.html for SPA behavior (only for /ai-gen-static paths)
        if path.startswith('/ai-gen-static'):
            index_path = os.path.join(self.directory, 'index.html')
            if os.path.exists(index_path):
                try:
                    with open(index_path, 'rb') as f:
                        content = f.read()
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except Exception as e:
                    print(f"Error serving index.html: {e}")
        
        # Return 404 for everything else
        self.send_error(404, "File not found")

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    # Bind to all interfaces (0.0.0.0) to allow remote access
    with socketserver.TCPServer(("0.0.0.0", port), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 Starting server on port {port}")
        print(f"🌐 Access your site at: http://0.0.0.0:{port}/ai-gen-static/")
        print(f"🌐 Or remotely at: http://YOUR_IP_ADDRESS:{port}/ai-gen-static/")
        print(f"🔍 Health check: http://0.0.0.0:{port}/health")
        print("📱 Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")

if __name__ == "__main__":
    main()
