"""Tests for public endpoints: species listing, settings, and contact form."""


class TestSpecies:
    def test_list_species_empty(self, client):
        resp = client.get('/api/species')
        assert resp.status_code == 200
        assert resp.get_json() == {'species': []}

    def test_list_species_after_seed(self, seeded_client):
        resp = seeded_client.get('/api/species')
        assert resp.status_code == 200
        species = resp.get_json()['species']
        assert len(species) == 1
        assert species[0]['name'] == 'African Elephant'


class TestSettings:
    def test_get_settings_returns_dict(self, client):
        resp = client.get('/api/settings')
        assert resp.status_code == 200
        assert isinstance(resp.get_json(), dict)


class TestContact:
    def test_contact_valid(self, client):
        resp = client.post('/api/contact', json={
            'name': 'Jane',
            'email': 'jane@example.com',
            'subject': 'Hello',
            'content': 'A message.',
        })
        assert resp.status_code == 201

    def test_contact_missing_fields(self, client):
        resp = client.post('/api/contact', json={'name': 'Jane'})
        assert resp.status_code == 400

    def test_contact_invalid_email(self, client):
        resp = client.post('/api/contact', json={
            'name': 'Jane',
            'email': 'nope',
            'subject': 'Hello',
            'content': 'Hi',
        })
        assert resp.status_code == 400
