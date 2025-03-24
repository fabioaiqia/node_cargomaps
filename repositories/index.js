const { default: axios } = require("axios");
const { pool } = require("../db")

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const getValidateCode = async (request, response) => {
    const { phone, code } = request.body;

    if(!phone || !code) {
        return response.status(400).json({error: false});
    } else {
        try {
            const query = `SELECT r.id, r.phone, c.code, c.created_at 
            FROM registers AS r 
            JOIN codes AS c ON r.id = c.register_id 
            WHERE r.phone = $1 AND c.code = $2`;
            const values = [phone, code]
            await pool.query(query, values, 
                (error, results) => {
                if (error) {
                    console.error('Erro ao validar code e telefone: ', error);
                    return response.status(500).json({ error: 'Erro interno do servidor.' });
                }
                if (results.rows.length > 0) {
                    response.status(200).json({ success: true });
                } else {
                    response.status(404).json({ error: false });
                }
            })
        } catch (e) {
            response.status(400).json({ error: false});
            console.error('Error ao buscar code e telefone: ', error);
            response.status(500).json({ error: 'Código não é mais válido'});
        }
    }
}

const postRegisters = async (request, response) => {
    const { phone } = request.body;
    if(!phone) return response.status(400).json({ error: 'Número de telefone obrigatório'});

    try {
        await pool.query('BEGIN');
        const existingRegisterResult = await pool.query('SELECT id FROM registers WHERE phone = $1', [phone]);
        let registerId;

        if(existingRegisterResult.rows.length > 0) {
            registerId = existingRegisterResult.rows[0].id;
            console.log('Telefone já cadastrado, register id: ' + registerId);
        } else {
            const newRegisterResult = await pool.query(
                'INSERT INTO registers (phone) VALUES ($1) RETURNING id', [phone]
            );
            registerId = newRegisterResult.rows[0].id;
            console.log('Telefone novo cadastrado, register id: ' + registerId);
        }

        const code = generateCode();
        const existingCodeResult = await pool.query(
            'SELECT id FROM codes WHERE register_id = $1', [registerId]
        );

        if (existingCodeResult.rows.length > 0) {
            await pool.query('UPDATE codes SET code = $1 WHERE register_id = $2', [code, registerId]);
            console.log('Código atualizado para ser enviado');
        } else {
            await pool.query('INSERT INTO codes (code, register_id) VALUES ($1, $2)', [code, registerId]);
            console.log('Código novo criado para ser enviado');
        }

        const formData = new FormData();
        formData.append('groups', '["' + phone + '@s.whatsapp.net"]');
        formData.append('message', code);
        console.log('Generated code: ', phone, code);
        await axios.post('https://aiqia-back-js-whatsappapi.rj.r.appspot.com/send-message/cargomaps', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

        await pool.query('COMMIT');
        response.json({ 
            success: true, 
            message: 'Código enviado com sucesso',
            code: code
        });
    } catch (error) {
        console.error('Error ao registrar telefone: ', error);
        response.status(500).json({ error: 'Erro interno no servidor'});
    }
}

module.exports = {
    getValidateCode,
    postRegisters
}