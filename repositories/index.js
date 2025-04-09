const { default: axios } = require("axios");
const { pool } = require("../db");
const path = require('path');


const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const getValidateCode = async (request, response) => {
    const { phone, code } = request.body;

    if(!phone || !code) {
        return response.status(400).json({error: false});
    } else {
        try {
            const query = `SELECT
            r.id, 
            r.phone,
            r.name,
            r.nickname,
            r.profile_picture,
            r.address,
            c.code,
            c.created_at 
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
                    const registerData = results.rows[0];
                    response.status(200).json({ success: true,
                        "register": {
                            "id": registerData.id,
                            "name": registerData.name,
                            "nickname": registerData.nickname,
                            "address": registerData.address,
                            'profile_picture': registerData.profile_picture
                        }
                    });
                } else {
                    response.status(200).json({ success: false });
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

        const nickname = `user${registerId}`;
        let savenickname = await pool.query(
            'UPDATE registers SET nickname = $1 WHERE id = $2  RETURNING nickname', [nickname, registerId]
        );
        console.log(savenickname.rows[0].nickname, nickname);

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

        // // const formData = new FormData();
        // // formData.append('groups', '["' + phone + '@s.whatsapp.net"]');
        // // formData.append('message', code);
        console.log('Generated code: ', phone, code);
        // // const whatsappResponse = await axios.post('https://aiqia-back-js-whatsappapi.rj.r.appspot.com/send-message/cargomaps', formData, {
        // //     headers: { 'Content-Type': 'multipart/form-data' },
        // // });
        
        // // if(whatsappResponse < 200 || whatsappResponse.status >= 300) {
        // //     throw new Error('Falha ao enviar mensagem via whatsapp');
        // // }

        await pool.query('COMMIT');
        response.status(200).json({ success: true }); 
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error ao registrar telefone: ', error);
        response.status(500).json({ error: 'Erro interno no servidor'});
    }
}

const updateRegister = async (request, response) => {
    const { id, name, nickname, address } = request.body;
    if(!nickname || nickname.trim() === '') {
        return response.status(400).json({ error: 'Nick name é obrigatório'})
    }
    try {
        const registerCheck = await pool.query('SELECT * FROM registers WHERE id = $1', [id]);
        if (registerCheck.rows.length === 0) {
            return response.status(404).json({ error: 'Registro não encontrado' });
        }

        const registerOriginal = registerCheck.rows[0];
        let queryText = '';
        let queryValues = [];
        let register;

        let profilePicturePath = null;
        if(request.file) {
            profilePicturePath = path.join('uploads', path.basename(request.file.path)).replace(/\\/g, '/');
            console.log('Caminho da imagem: ', profilePicturePath);
        } else {
            console.log('Nenhuma imagem enviada');
        }

        if(registerOriginal.nickname !== nickname) {
            const newNicknameCheck = await pool.query('SELECT id FROM registers WHERE nickname = $1', [nickname]);
            if (newNicknameCheck.rows.length > 0) {
                return response.status(400).json({ error: 'Nickname já está em uso' });
            }
            if (profilePicturePath) {
                queryText = 'UPDATE registers SET name = $1, nickname = $2, address = $3, profile_picture = $4 WHERE id = $5 RETURNING *';
                  queryValues = [name, nickname, address, profilePicturePath, id];
            } else {
                queryText = 'UPDATE registers SET name = $1, nickname = $2, address = $3 WHERE id = $4 RETURNING *';
                queryValues = [name, nickname, address, id];
            }
        } else {
            if(profilePicturePath) {
                queryText = 'UPDATE registers SET name = $1, address = $2, profile_picture = $3 WHERE id = $4 RETURNING *';
                queryValues = [name, address, profilePicturePath, id];
            } else {
                queryText = 'UPDATE registers SET name = $1, address = $2 WHERE id = $3 RETURNING *';
                queryValues = [name, address, id];
            }
        }
        register = await pool.query(queryText, queryValues);

        if(register.rows.length > 0){
            return response.status(200).json({ success: true, register: register.rows[0] });
          } else {
            return response.status(400).json({ success: false, error: "não foi possivel atualizar o registro" });
          }
    } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        return response.status(500).json({ error: 'Erro interno no servidor' });
    }
}

const postTruck = async (request, response) => {
    const { register_id, type, height, width, length, weight } = request.body;
  
    if (!register_id || !type) {
      return response.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }
  
    try {
      await pool.query('BEGIN');
  
      // Verifica se já existe um caminhão para esse register_id
      const existingTruck = await pool.query(
        'SELECT id FROM trucks WHERE register_id = $1',
        [register_id]
      );
  
      if (existingTruck.rows.length > 0) {
        // Caminhão já existe, faz update
        const truckId = existingTruck.rows[0].id;
        await pool.query(
          `UPDATE trucks 
           SET type = $1, height = $2, width = $3, length = $4, weight = $5, created_at = NOW()
           WHERE id = $6`,
          [type, height, width, length, weight, truckId]
        );
        console.log(`Caminhão para register_id ${register_id} atualizado com sucesso.`);
      } else {
        // Não existe, cria novo
        await pool.query(
          `INSERT INTO trucks (register_id, type, height, width, length, weight)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [register_id, type, height, width, length, weight]
        );
        console.log(`Novo caminhão para register_id ${register_id} cadastrado com sucesso.`);
      }
  
      await pool.query('COMMIT');
      return response.status(200).json({ success: true });
  
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Erro ao salvar caminhão:', error);
      return response.status(500).json({ success: false, error: 'Erro ao salvar caminhão' });
    }
};  

module.exports = {
    getValidateCode,
    postRegisters,
    postTruck,
    updateRegister,
}