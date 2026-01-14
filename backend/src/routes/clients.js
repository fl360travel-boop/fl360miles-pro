import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/clients.json');

// Helper functions
const readClients = () => {
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeClients = (clients) => {
    fs.writeFileSync(dataPath, JSON.stringify(clients, null, 2));
};

// GET all clients
router.get('/', (req, res) => {
    try {
        const clients = readClients();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// GET single client by ID
router.get('/:id', (req, res) => {
    try {
        const clients = readClients();
        const client = clients.find(c => c.id === req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// POST create new client
router.post('/', (req, res) => {
    try {
        const clients = readClients();
        const newClient = {
            id: `CL-${Date.now()}`,
            ...req.body,
            programs: req.body.programs || [],
            cards: req.body.cards || [],
            history: req.body.history || [],
            economyHistory: req.body.economyHistory || []
        };
        clients.push(newClient);
        writeClients(clients);
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// PUT update client
router.put('/:id', (req, res) => {
    try {
        const clients = readClients();
        const index = clients.findIndex(c => c.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Client not found' });
        }
        clients[index] = { ...clients[index], ...req.body };
        writeClients(clients);
        res.json(clients[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// DELETE client
router.delete('/:id', (req, res) => {
    try {
        const clients = readClients();
        const index = clients.findIndex(c => c.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Client not found' });
        }
        const deleted = clients.splice(index, 1);
        writeClients(clients);
        res.json(deleted[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

export default router;
