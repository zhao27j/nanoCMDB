# Dockerfile

# The first instruction is what image we want to base our container on
# We Use an official Python runtime as a parent image


# FROM python:3.9.12
# FROM python:3.12.3
FROM python:3.12.6


# Install cron and any other dependencies
RUN apt-get update && apt-get install -y cron


# Install Django and other Python dependencies
COPY requirements.txt requirements.txt

RUN pip config set global.trusted-host pypi.python.org
RUN pip config set global.trusted-host pypi.org
RUN pip config set global.trusted-host files.pythonhosted.org
RUN pip config set global.index-url http://mirrors.aliyun.com/pypi/simple
RUN pip config set global.trusted-host mirrors.aliyun.com

RUN pip install --no-cache-dir -r requirements.txt --trusted-host=mirrors.aliyun.com


# Copy the Django project into the container
COPY . nanoCMDB
# Copy your Django project into the container
WORKDIR /nanoCMDB



# Add the cron job file
COPY nanoCrontab-todo /etc/cron.d/nanoCrontab-todo
# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/nanoCrontab-todo
# Apply the cron job
RUN crontab /etc/cron.d/nanoCrontab-todo
# Create the log file to be able to run tail
RUN touch /var/log/nanoCrontab-todo.log
# Run the cron service
# RUN cron && tail -f /var/log/nanoCrontab-todo.log


EXPOSE 8000

# Set environment variables
# ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1


# Set the entrypoint to run the Django server
ENTRYPOINT ["python", "manage.py"]
# Default command to run the server
CMD ["runserver", "0.0.0.0:8000"]

# ENTRYPOINT ["sh", "-c", "cron && tail -f /var/log/nanoCrontab-todo.log & python manage.py runserver 0.0.0.0:8000"]

# Combine the commands in the CMD instruction
# CMD cron && tail -f /var/log/nanoCrontab-todo.log & python manage.py runserver 0.0.0.0:8000