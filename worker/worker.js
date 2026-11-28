
const TABLE_NAME = 'Scores'; 


let memoryScores = [];

export default {
    async fetch(request, env) {
        
        const AIRTABLE_TOKEN = env.AIRTABLE_TOKEN;
        const BASE_ID = env.BASE_ID;

        const url = new URL(request.url);
        const path = url.pathname;
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
        
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        
        if (path === '/api/top-scores' && request.method === 'GET') {
            if (AIRTABLE_TOKEN && BASE_ID) {
                try {
                    const airtableUrl = `https://airtable.com{BASE_ID}/${TABLE_NAME}?sort[0][field]=FScore&sort[0][direction]=desc&maxRecords=10`;
                    
                    const response = await fetch(airtableUrl, {
                        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const top = (data.records || []).map(record => ({
                            name: record.fields.Name || 'Аноним',
                            score: record.fields.FScore || 0
                        }));
                        
                        return new Response(JSON.stringify({ success: true, top: top }), {
                            headers: { 'Content-Type': 'application/json', ...corsHeaders }
                        });
                    }
                } catch (e) {
                    console.log('Airtable read error, using memory');
                }
            }
            
            
            const top = memoryScores.slice(0, 5);
            return new Response(JSON.stringify({ success: true, top: top }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        
        
        if (path === '/api/save-score' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { playerName, score, gameData } = body;
                
                console.log(` Запрос: ${playerName} - ${score} очков`);
                
                
                let isValid = true;
                let failReason = '';
                
                if (score > 500) {
                    isValid = false;
                    failReason = 'Слишком большой счёт (макс. 500)';
                }
                
                if (gameData && gameData.gameDuration && score > 50) {
                    const minPossibleTime = score * 40;
                    if (gameData.gameDuration < minPossibleTime) {
                        isValid = false;
                        failReason = 'Слишком быстро';
                    }
                }
                
                if (gameData && gameData.totalCatches > 0) {
                    const goldenPercent = (gameData.goldenCatches / gameData.totalCatches) * 100;
                    if (goldenPercent > 70) {
                        isValid = false;
                        failReason = 'Слишком много золотых яиц';
                    }
                }
                
                if (!isValid) {
                    console.log(` Отклонено: ${failReason}`);
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: failReason 
                    }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }
                
                
                let airtableSuccess = false;
                if (AIRTABLE_TOKEN && BASE_ID) {
                    try {
                        const airtableUrl = `https://airtable.com{BASE_ID}/${TABLE_NAME}`;
                        
                        const airtableResponse = await fetch(airtableUrl, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                records: [{
                                    fields: {
                                        "Name": String(playerName || 'Аноним').substring(0, 20),
                                        "FScore": parseInt(score, 10) || 0
                                    }
                                }]
                            })
                        });
                        
                        if (airtableResponse.ok) {
                            airtableSuccess = true;
                            console.log(` Сохранено в Airtable: ${playerName} - ${score}`);
                        } else {
                            console.log(` Airtable ошибка: ${airtableResponse.status}`);
                        }
                    } catch (e) {
                        console.log(` Airtable недоступен: ${e.message}`);
                    }
                }
                
                
                memoryScores.push({
                    name: String(playerName || 'Аноним').substring(0, 20),
                    score: parseInt(score, 10) || 0,
                    timestamp: Date.now()
                });
                memoryScores.sort((a, b) => b.score - a.score);
                if (memoryScores.length > 10) memoryScores = memoryScores.slice(0, 10);
                
                const message = airtableSuccess 
                    ? 'Результат сохранён в таблицу лидеров!' 
                    : 'Результат сохранён локально (Airtable временно недоступен)';
                
                return new Response(JSON.stringify({ 
                    success: true, 
                    message: message,
                    airtable: airtableSuccess
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
                
            } catch (e) {
                console.error('Ошибка:', e);
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: e.message 
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }
        

        const isConfigured = Boolean(AIRTABLE_TOKEN && BASE_ID);
        return new Response(JSON.stringify({ 
            status: 'ok', 
            message: 'Сервер работает! Airtable ' + (isConfigured ? 'подключен' : 'не настроен (проверьте переменные окружения)')
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
};
