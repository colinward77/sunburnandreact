# ---------- base image ----------
    FROM public.ecr.aws/docker/library/node:18

    # ---------- app code ----------
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci          # install prod & dev deps
    
    COPY . .
    
    # ---------- build React ----------
    RUN npm run build   # produces /dist via Vite
    
    # ---------- expose and start ----------
    EXPOSE 3000
    CMD ["npm", "start"]   # package.json must have  "start": "node server.js"
    