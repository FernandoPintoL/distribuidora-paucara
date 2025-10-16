import axios from 'axios';

export const EstadoMermaService = {
    async getAll() {
        const { data } = await axios.get('/api/estado-mermas');
        return data.data;
    },
    async create(payload) {
        const { data } = await axios.post('/api/estado-mermas', payload);
        return data.data;
    },
    async update(id, payload) {
        const { data } = await axios.put(`/api/estado-mermas/${id}`, payload);
        return data.data;
    },
    async remove(id) {
        await axios.delete(`/api/estado-mermas/${id}`);
    }
};
