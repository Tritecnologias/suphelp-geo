import pandas as pd
import os
import time
from datetime import datetime

class CondominioAnalyzer:
    def __init__(self, excel_file_path=None):
        """Inicializa o analisador"""
        self.results = []
        
        if excel_file_path and os.path.exists(excel_file_path):
            try:
                self.df = pd.read_excel(excel_file_path)
                print(f"✅ Arquivo carregado: {excel_file_path}")
                print(f"📊 Total de registros: {len(self.df)}")
            except Exception as e:
                print(f"❌ Erro ao ler arquivo: {e}")
                self.create_sample_data()
        else:
            print("📝 Criando dados de exemplo...")
            self.create_sample_data()
    
    def create_sample_data(self):
        """Cria dados de exemplo"""
        self.df = pd.DataFrame({
            'nome': ['Abitare Eco Clube', 'Condomínio Garden Resort'],
            'endereco': ['R. Siracusa, 110', 'Av. Antônio Frederico Ozanan, 9700'],
            'bairro': ['Jardim Messina', 'Jardim Shangai'],
            'google_maps_url': ['https://maps.example.com/1', 'https://maps.example.com/2'],
            'types': ['condominium', 'condominium']
        })
        print("✅ Dados de exemplo criados (2 condomínios)")
    
    def get_known_contacts(self):
        """Retorna dicionário de contatos conhecidos"""
        return {
            'Abitare Eco Clube': {
                'telefone': '(11) 4525-4500',
                'email': '',
                'site': '',
                'administradora': '',
                'status': 'Contato confirmado',
                'fonte': 'Imóveis Jundiaí'
            },
            'Condomínio Garden Resort': {
                'telefone': '(11) 4582-2282',
                'email': 'vendas@gardenresortjundiai.com.br',
                'site': 'https://www.gardenresortjundiai.com.br',
                'administradora': 'LUC Administradora',
                'status': 'Contato confirmado',
                'fonte': 'Site oficial'
            },
            'Kaza Condomínio Club': {
                'telefone': '(11) 4589-9000',
                'email': 'contato@kazacc.com.br',
                'site': 'https://www.kazacc.com.br',
                'administradora': 'Kaza Condomínio Club',
                'status': 'Contato confirmado',
                'fonte': 'Site oficial'
            },
            'Vittá Condomínio Clube': {
                'telefone': '(11) 4582-7100',
                'email': 'contato@vittacc.com.br',
                'site': 'https://www.vittacc.com.br',
                'administradora': 'Vittá Condomínio Clube',
                'status': 'Contato confirmado',
                'fonte': 'Site oficial'
            },
            'Veduta Residencial': {
                'telefone': '(11) 4589-7900',
                'email': '',
                'site': 'https://www.vedutaresidencial.com.br',
                'administradora': '',
                'status': 'Contato parcial',
                'fonte': 'Site de vendas'
            },
            'Condomínio Infinity Top Living': {
                'telefone': '(11) 4525-9444',
                'email': '',
                'site': 'https://www.infinitytopliving.com.br',
                'administradora': 'Infinity Top Living',
                'status': 'Contato confirmado',
                'fonte': 'Site oficial'
            }
        }
    
    def analyze_row(self, row_series):
        """Analisa uma linha do DataFrame"""
        # Acessa os valores da série (linha do DataFrame)
        nome = str(row_series['nome']) if pd.notna(row_series.get('nome')) else 'Sem nome'
        bairro = str(row_series['bairro']) if pd.notna(row_series.get('bairro')) else 'Não informado'
        endereco = str(row_series['endereco']) if pd.notna(row_series.get('endereco')) else 'Não informado'
        maps_url = str(row_series['google_maps_url']) if pd.notna(row_series.get('google_maps_url')) else ''
        
        # Verifica contatos conhecidos
        known_contacts = self.get_known_contacts()
        contact_info = known_contacts.get(nome, {})
        
        # Determina status e prioridade
        telefone = contact_info.get('telefone', '')
        if telefone:
            status = '✅ Com contato'
            prioridade = 'Baixa'
        else:
            status = '🔍 Sem contato'
            prioridade = 'Alta'
        
        # Gera termos de busca
        termos_busca = [
            f'"{nome}" Jundiaí telefone',
            f'"{nome}" administradora',
            f'"{nome}" síndico contato',
            f'condomínio {nome} {bairro} Jundiaí'
        ]
        
        # Retorna resultado
        return {
            'Condomínio': nome,
            'Bairro': bairro,
            'Endereço': endereco,
            'Google Maps': maps_url,
            'Telefone': telefone,
            'E-mail': contact_info.get('email', ''),
            'Site': contact_info.get('site', ''),
            'Administradora': contact_info.get('administradora', ''),
            'Status': contact_info.get('status', status),
            'Fonte': contact_info.get('fonte', 'Buscar manualmente'),
            'Prioridade': prioridade,
            'Termos de Busca': ' | '.join(termos_busca[:3]),
            'Data Análise': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def process_all(self, max_items=None):
        """Processa todos os condomínios"""
        total = len(self.df) if max_items is None else min(max_items, len(self.df))
        
        print(f"\n{'='*60}")
        print(f"📋 INICIANDO ANÁLISE DE {total} CONDOMÍNIOS")
        print(f"{'='*60}\n")
        
        self.results = []
        
        for idx in range(total):
            row = self.df.iloc[idx]
            result = self.analyze_row(row)
            self.results.append(result)
            
            # Exibe progresso
            nome_display = result['Condomínio'][:40] + '...' if len(result['Condomínio']) > 40 else result['Condomínio']
            status_icon = '✅' if result['Telefone'] else '🔍'
            print(f"{status_icon} [{idx+1:3d}/{total}] {nome_display:45} | {result['Status']}")
            
            # Pequena pausa para visualização
            if idx % 10 == 0:
                time.sleep(0.1)
        
        print(f"\n{'='*60}")
        print(f"✅ ANÁLISE CONCLUÍDA - {len(self.results)} CONDOMÍNIOS")
        print(f"{'='*60}")
        
        return self.results
    
    def export_results(self, filename=None):
        """Exporta resultados para Excel"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'analise_condominios_{timestamp}.xlsx'
        
        # Cria DataFrame com resultados
        df_results = pd.DataFrame(self.results)
        
        # Exporta para Excel
        df_results.to_excel(filename, index=False)
        
        print(f"\n📊 Resultados exportados para: {filename}")
        print(f"   Total de registros: {len(df_results)}")
        
        return filename
    
    def generate_report(self):
        """Gera relatório resumido"""
        if not self.results:
            print("❌ Nenhum resultado para gerar relatório")
            return None
        
        total = len(self.results)
        com_contato = sum(1 for r in self.results if r['Telefone'])
        sem_contato = total - com_contato
        
        # Agrupa por prioridade
        alta_prioridade = sum(1 for r in self.results if r['Prioridade'] == 'Alta')
        baixa_prioridade = total - alta_prioridade
        
        # Relatório
        report = f"""
{'='*70}
📈 RELATÓRIO DE ANÁLISE - CONDOMÍNIOS JUNDIAÍ
{'='*70}
Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
Total analisado: {total}

📊 ESTATÍSTICAS:
   • Com contato: {com_contato} ({com_contato/total*100:.1f}%)
   • Sem contato: {sem_contato} ({sem_contato/total*100:.1f}%)
   • Alta prioridade: {alta_prioridade} ({alta_prioridade/total*100:.1f}%)
   • Baixa prioridade: {baixa_prioridade} ({baixa_prioridade/total*100:.1f}%)

🔍 TOP 10 SEM CONTATO (ALTA PRIORIDADE):
"""
        
        # Lista os 10 primeiros sem contato
        sem_contato_list = [r for r in self.results if not r['Telefone']]
        for i, cond in enumerate(sem_contato_list[:10], 1):
            report += f"   {i:2d}. {cond['Condomínio'][:50]:50} - {cond['Bairro']}\n"
        
        if len(sem_contato_list) > 10:
            report += f"   ... e mais {len(sem_contato_list)-10} condomínios\n"
        
        report += f"""
✅ TOP 10 COM CONTATO:
"""
        
        # Lista os 10 primeiros com contato
        com_contato_list = [r for r in self.results if r['Telefone']]
        for i, cond in enumerate(com_contato_list[:10], 1):
            report += f"   {i:2d}. {cond['Condomínio'][:40]:40} - Tel: {cond['Telefone']}\n"
        
        if len(com_contato_list) > 10:
            report += f"   ... e mais {len(com_contato_list)-10} condomínios\n"
        
        report += f"""
💡 RECOMENDAÇÕES:
   1. Focar nos {sem_contato} condomínios sem contato
   2. Usar os termos de busca sugeridos no Excel
   3. Consultar Google Maps para cada condomínio
   4. Validar contatos com ligações teste
   5. Documentar novas informações encontradas

{'='*70}
"""
        
        # Salva relatório
        report_file = f'relatorio_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(report)
        print(f"📋 Relatório salvo como: {report_file}")
        
        return report_file

def main():
    """Função principal"""
    print("="*70)
    print("🏢 ANALISADOR DE CONDOMÍNIOS - JUNDIAÍ/SP")
    print("="*70)
    
    # Solicita arquivo
    default_path = "/home/diego/OneDrive/Estudo/Exercicio_Python/metricas/condominios_jundiai_resumo_teste.xlsx"
    excel_file = input(f"\n📂 Caminho do arquivo Excel [Enter para usar padrão: {default_path}]: ").strip()
    
    if not excel_file:
        excel_file = default_path
        print(f"Usando caminho padrão: {excel_file}")
    
    # Verifica se arquivo existe
    if not os.path.exists(excel_file):
        print(f"\n⚠️  ATENÇÃO: Arquivo não encontrado!")
        print(f"   Caminho: {excel_file}")
        print("\n📁 Arquivos disponíveis na pasta:")
        try:
            files = os.listdir(os.path.dirname(excel_file) if os.path.dirname(excel_file) else '.')
            excel_files = [f for f in files if f.lower().endswith(('.xlsx', '.xls'))]
            for f in excel_files[:10]:  # Mostra até 10 arquivos
                print(f"   • {f}")
            if len(excel_files) > 10:
                print(f"   • ... e mais {len(excel_files)-10} arquivos")
        except:
            print("   Não foi possível listar arquivos da pasta")
        
        usar_exemplo = input("\n🔧 Usar dados de exemplo? (s/n): ").strip().lower()
        if usar_exemplo != 's':
            return
        excel_file = None
    
    # Quantidade a processar
    try:
        max_input = input("\n🔢 Quantos condomínios analisar? [Enter para todos]: ").strip()
        max_items = int(max_input) if max_input else None
    except ValueError:
        print("⚠️  Entrada inválida. Analisando todos.")
        max_items = None
    
    # Executa análise
    try:
        print("\n" + "="*60)
        print("🚀 INICIANDO ANÁLISE...")
        print("="*60)
        
        analyzer = CondominioAnalyzer(excel_file)
        analyzer.process_all(max_items)
        
        # Exporta resultados
        excel_file = analyzer.export_results()
        
        # Gera relatório
        report_file = analyzer.generate_report()
        
        print("\n" + "="*70)
        print("🎉 PROCESSO CONCLUÍDO COM SUCESSO!")
        print("="*70)
        print(f"\n📁 ARQUIVOS GERADOS:")
        print(f"   1. {excel_file} - Análise completa em Excel")
        print(f"   2. {report_file} - Relatório resumido")
        
        # Estatísticas finais
        total = len(analyzer.results)
        com_contato = sum(1 for r in analyzer.results if r['Telefone'])
        
        print(f"\n📊 RESUMO FINAL:")
        print(f"   • Total analisado: {total}")
        print(f"   • Com contato: {com_contato} ({com_contato/total*100:.1f}%)")
        print(f"   • Sem contato: {total-com_contato} ({(total-com_contato)/total*100:.1f}%)")
        
        print(f"\n💡 PRÓXIMOS PASSOS:")
        print("   1. Abra o arquivo Excel para ver todos os dados")
        print("   2. Use a coluna 'Termos de Busca' para pesquisar")
        print("   3. Para sem contato, siga as sugestões do relatório")
        print("   4. Valide contatos com ligações teste")
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()

# Versão alternativa MUITO simples para teste rápido
def versao_super_simples():
    """Versão ultra simplificada para teste"""
    print("="*60)
    print("🏢 ANALISADOR SIMPLES DE CONDOMÍNIOS")
    print("="*60)
    
    caminho = "/home/diego/OneDrive/Estudo/Exercicio_Python/metricas/condominios_jundiai_resumo_teste.xlsx"
    
    if os.path.exists(caminho):
        print(f"\n📂 Lendo arquivo: {caminho}")
        
        try:
            # Lê o arquivo
            df = pd.read_excel(caminho)
            print(f"✅ {len(df)} condomínios encontrados")
            
            # Mostra primeiras linhas
            print("\n📋 PRIMEIROS 5 CONDOMÍNIOS:")
            for i in range(min(5, len(df))):
                nome = df.iloc[i]['nome'] if 'nome' in df.columns else f"Condomínio {i+1}"
                bairro = df.iloc[i]['bairro'] if 'bairro' in df.columns else "Não informado"
                print(f"   {i+1}. {nome} - {bairro}")
            
            # Contatos conhecidos
            contatos = {
                'Abitare Eco Clube': '(11) 4525-4500',
                'Condomínio '
                'Garden Resort': '(11) 4582-2282',
                'Kaza Condomínio Club': '(11) 4589-9000'
            }
            
            # Verifica quais tem contato
            print("\n🔍 VERIFICANDO CONTATOS CONHECIDOS:")
            encontrados = []
            for nome in df['nome']:
                if nome in contatos:
                    encontrados.append((nome, contatos[nome]))
            
            if encontrados:
                for nome, tel in encontrados:
                    print(f"   ✅ {nome}: {tel}")
            else:
                print("   ❌ Nenhum contato conhecido encontrado")
            
            # Salva resultado simples
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output = f'resultado_simples_{timestamp}.csv'
            df.to_csv(output, index=False, encoding='utf-8')
            print(f"\n📁 Arquivo salvo: {output}")
            
        except Exception as e:
            print(f"❌ Erro: {e}")
    else:
        print(f"\n❌ Arquivo não encontrado: {caminho}")

if __name__ == "__main__":
    # Execute a função principal
    main()
    
    # Ou para teste rápido, descomente a linha abaixo:
    # versao_super_simples()
    