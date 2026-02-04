# Usamos uma imagem Node leve baseada em Debian (melhor compatibilidade que Alpine para Python)
FROM node:20-slim

# 1. Instalar Python 3, PIP e dependências de build
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar Ambiente Virtual Python (Boas práticas para não quebrar o sistema)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 3. Definir diretório de trabalho
WORKDIR /app

# 4. Copiar arquivos de dependências
COPY package*.json ./
COPY requirements.txt ./

# 5. Instalar dependências (Python e Node)
RUN pip install --no-cache-dir -r requirements.txt
RUN npm install

# 6. Copiar o restante do código
COPY . .

# 7. Expor a porta da API
EXPOSE 4000

# O comando final é definido no docker-compose (npm run dev)
