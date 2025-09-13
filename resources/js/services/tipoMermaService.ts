import axios from 'axios';

export const TipoMermaService = {
    async getAll() {
        const { data } = await axios.get('/api/tipo-mermas');
        return data.data;
    },
    async create(payload) {
        const { data } = await axios.post('/api/tipo-mermas', payload);
        return data.data;
    },
    async update(id, payload) {
        const { data } = await axios.put(`/api/tipo-mermas/${id}`, payload);
        return data.data;
    },
    async remove(id) {
        await axios.delete(`/api/tipo-mermas/${id}`);
    }
};
