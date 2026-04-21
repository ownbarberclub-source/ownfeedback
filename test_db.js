const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- INICIANDO TESTE DE BANCO DE DADOS (SUPABASE) ---\n');

  try {
    // 1. Teste no HUB (Tabela hub_sites - Leitura)
    console.log('1. Testando [OWN Hub]...');
    const { data: hubData, error: hubErr } = await supabase.from('hub_sites').select('id, name').limit(1);
    if (hubErr) throw hubErr;
    console.log('   ✅ Conexão e Leitura OK:', hubData[0] ? hubData[0].name : 'Sem dados');

    // 2. Teste no FEEDBACK (Tabela feedback_units - Escrita e Leitura)
    console.log('\n2. Testando [OWN Feedback]...');
    const testUnitId = '00000000-0000-0000-0000-000000000000'; // test uuid
    const { error: fbInsertErr } = await supabase.from('feedback_units').upsert([{ id: testUnitId, name: 'TESTE AUTOMATIZADO' }]);
    if (fbInsertErr) {
        console.log('   ❌ Erro ao salvar:', fbInsertErr.message);
    } else {
        console.log('   ✅ Gravação (INSERT) OK!');
        const { error: fbDelErr } = await supabase.from('feedback_units').delete().eq('id', testUnitId);
        if (fbDelErr) console.log('   ❌ Erro ao deletar:', fbDelErr.message);
        else console.log('   ✅ Exclusão (DELETE) OK!');
    }

    console.log('\n--- TODOS OS TESTES FINALIZADOS COM SUCESSO ---');
  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', error);
  }
}

runTests();
