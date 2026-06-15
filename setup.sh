#!/bin/bash
set -e

echo " PayGate Dashboard Setup"
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

cd ..

# Copy env files if they don't exist
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}⚠️  Created backend/.env — please fill in your Stripe keys${NC}"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo -e "${YELLOW}⚠️  Created frontend/.env — please fill in your Stripe publishable key${NC}"
fi

echo ""
echo -e "${GREEN} Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your MongoDB URI and Stripe keys"
echo "  2. Edit frontend/.env with your Stripe publishable key"
echo "  3. Run: cd backend && npm run seed"
echo "  4. Run: cd backend && npm run dev  (in terminal 1)"
echo "  5. Run: cd frontend && npm start   (in terminal 2)"
echo ""
echo "  Admin login: admin@paygate.com / Admin@123"
echo "  Stripe test card: 4242 4242 4242 4242"
echo ""
