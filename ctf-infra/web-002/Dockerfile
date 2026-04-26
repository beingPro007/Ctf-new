FROM php:8.2-apache

COPY index.php /var/www/html/
RUN mkdir -p /var/www/html/pages /var/www/html/secret

RUN echo "<h2>Welcome to TechBlog</h2><p>This is the home page of our cutting-edge blog platform. Browse articles in the navigation above.</p>" > /var/www/html/pages/home.html
RUN echo "<h2>About Us</h2><p>TechBlog is a fictional company. Nothing to see here.</p>" > /var/www/html/pages/about.html
RUN echo "<h2>Contact</h2><p>Email: admin@techblog.local</p>" > /var/www/html/pages/contact.html

RUN echo "CTF{lfi_traversal_rce_unlocked_7734}" > /var/www/html/secret/flag.txt
RUN chmod 644 /var/www/html/secret/flag.txt

EXPOSE 80
