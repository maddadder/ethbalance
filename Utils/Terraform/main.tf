# 1. create vpc
# 2. Create Internet gateway
# 3. Create custom route table
# 4. Create a Subnet
# 5. Associate Subnet with route table
# 6. Create Security Group to allow port 3389,80,443
# 7. Create a network interface with an ip in the subnet that was created in step 4
# 8. Assign an Elastic IP to the network interface created in step 7
# 9. Pull in a docker image and host it
# 10. Monitoring
# 11. Scaling



 provider "aws" {
   region = "us-west-2"
   access_key = ""
   secret_key = ""
 }

# I realize I could use terragrunt here to DRY the creation of the VPC

 # 1. create vpc
resource "aws_vpc" "prod-vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    "Name" = "Production"
  }
}
# 2. Create Internet gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.prod-vpc.id
}
# 3. Create custom route table
resource "aws_route_table" "prod-route-table" {
  vpc_id = aws_vpc.prod-vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  route {
    ipv6_cidr_block        = "::/0"
    gateway_id = aws_internet_gateway.gw.id
  }
 tags = {
    Name = "prod"
  }
}

# 4. Create a Subnet

 resource "aws_subnet" "subnet-1" {
  vpc_id     = aws_vpc.prod-vpc.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "prod-subnet"
  }
 }
# 5. Associate Subnet with route table

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.subnet-1.id
  route_table_id = aws_route_table.prod-route-table.id
}

# 6. Create Security Group to allow port 3389,80,443

resource "aws_security_group" "allow_web" {
  name        = "allow_web_traffic"
  description = "Allow web inbound traffic"
  vpc_id      = aws_vpc.prod-vpc.id

  ingress {
    description = "https"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "http"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "ssh"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_web"
  }
}

# 7. Create a network interface with an ip in the subnet that was created in step 4

resource "aws_network_interface" "web-server-nic" {
  subnet_id       = aws_subnet.subnet-1.id
  private_ips     = ["10.0.1.50"]
  security_groups = [aws_security_group.allow_web.id]

  
  }

# 8. Assign an Elastic IP to the network interface crteated in step 7

resource "aws_eip" "one" {
  vpc                       = true
  network_interface         = aws_network_interface.web-server-nic.id
  associate_with_private_ip = "10.0.1.50"
  depends_on = [aws_internet_gateway.gw]
}

#9 I cheated for now and loaded ubuntu

resource "aws_instance" "web-server-instance" {
  ami           = "ami-0ca5c3bd5a268e7db"
  instance_type = "t2.micro"
  availability_zone = "us-west-2a"
  key_name = "ethbalance" #main-key pem file https://us-west-2.console.aws.amazon.com/ec2/v2/home?region=us-west-2#KeyPairs:sort=desc:key-pair-id

  network_interface {
    device_index = 0
    network_interface_id = aws_network_interface.web-server-nic.id

  }
  user_data = <<-EOF
            #!/bin/bash
            sudo apt update -y
            sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release -y
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update -y
            sudo apt-get install docker-ce docker-ce-cli containerd.io -y
            sudo service docker start
            sudo docker pull charlierlee/ethbalance
            sudo docker run -d -p 443:443 -p 80:80 charlierlee/ethbalance
            EOF

 tags = {
     name = "web-server"
 }
}
