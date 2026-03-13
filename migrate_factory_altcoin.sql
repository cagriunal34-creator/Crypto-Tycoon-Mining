-- Factory ve Altcoin verileri için yeni kolonlar ekliyoruz
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS factory_data JSONB DEFAULT '{
  "slots": [
    {"id":0, "state":"idle", "recipeId":null, "startedAt":0, "finishesAt":0, "locked":false, "unlockCost":0},
    {"id":1, "state":"idle", "recipeId":null, "startedAt":0, "finishesAt":0, "locked":false, "unlockCost":0},
    {"id":2, "state":"idle", "recipeId":null, "startedAt":0, "finishesAt":0, "locked":true,  "unlockCost":3000},
    {"id":3, "state":"idle", "recipeId":null, "startedAt":0, "finishesAt":0, "locked":true,  "unlockCost":6000},
    {"id":4, "state":"idle", "recipeId":null, "startedAt":0, "finishesAt":0, "locked":true,  "unlockCost":12000},
    {"id":5, "state":"idle", "recipeId":null, "startedAt":0, "finishesAt":0, "locked":true,  "unlockCost":25000}
  ],
  "resources": {"silicon":15, "copper":12, "lithium":8, "rare":3},
  "unlockedRecipes": ["r_chip", "r_wire"]
}'::JSONB,
ADD COLUMN IF NOT EXISTS altcoin_balances JSONB DEFAULT '{
  "eth":0, "sol":0, "bnb":0, "doge":0, "ada":0, "avax":0
}'::JSONB;
