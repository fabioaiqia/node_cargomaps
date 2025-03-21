const { default: axios } = require("axios");
const { pool } = require("../db")

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const getRegisters = async (request, response) => {
    const { phone, code } = request.body;
    try {
        await pool.query('SELECT r.id, r.phone, c.code, c.created_at FROM registers AS r ' +
            'JOIN codes AS c ' + 
            'ON r.id = c.register_id WHERE r.phone = ' + phone + 
            ' AND c.code = '+ code +'', 
            (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).json({ success: 'ok'});
        })
    } catch (e) {
        console.error('Error ao buscar code e telefone: ', error);
        response.status(500).json({ error: 'Código não é mais válido'});
    }
    
}

const postRegisters = async (request, response) => {
    const { phone } = request.body;
    if(!phone) return response.status(400).json({ error: 'Número de telefone obrigatório'});

    try {
        const registerResult = await pool.query(
            'INSERT INTO registers (phone) VALUES ($1) RETURNING id',
            [phone]
        );
        const registerId = registerResult.rows[0].id;
        const code = generateCode()
        await pool.query(
            'INSERT INTO codes (code, register_id) VALUES ($1, $2)',
            [code, registerId]
        )

        const formData = new FormData();
        formData.append('groups', '["' + phone + '@s.whatsapp.net"]');
        formData.append('message', code);
            console.log('Generated code: ', phone, code);
            await axios.post('https://aiqia-back-js-whatsappapi.rj.r.appspot.com/send-message/cargomaps', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            response.json({ success: true, message: 'Código enviado com sucesso'});
        } catch (error) {
            console.error('Error ao registrar telefone: ', error);
            response.status(500).json({ error: 'Erro interno no servidor'});
        }
}

module.exports = {
    getRegisters,
    postRegisters
}