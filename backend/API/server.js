const express = require('express');
const app = express();
const species = require('../models/species');
app.get('/api/species/:id', (req,res)=> {
  const id = parseInt(req.params.id);
  const animal = species.find(s => s.id === id);
  res.json(animal);
});
app.listen(3000, ()=> console.log('API running on port 3000'));
