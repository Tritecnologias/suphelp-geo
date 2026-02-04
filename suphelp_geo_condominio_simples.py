#!/usr/bin/env python3
# analisador_ultra_simples.py

import pandas as pd
import os
from datetime import datetime

def analisar_condominios():
    print("="*70)
    print("🏢 ANALISADOR ULTRA SIMPLES DE CONDOMÍNIOS")
    print("="*70)
    
    # Caminho do arquivo
    arquivo = "condominios_jundiai_resumo_teste.xlsx"
    
    # Verifica se arquivo existe
    if not os.path.exists(arquivo):
        print(f"\n❌ Arquivo '{arquivo}' não encontrado na pasta atual.")
        print("\n📁 Listando arquivos na pasta:")
        
        # Lista arquivos Excel
        pasta = "."
        for f in os.listdir(pasta):
            if f.lower().endswith(('.xlsx', '.xls')):
                print(f"   • {f}")
        
        # Pede novo caminho
        arquivo = input("\n📥 Digite o nome do arquivo Excel: ").strip()
        
        if not os.path.exists(arquivo):
            print("❌ Arquivo não encontrado. Encerrando.")
            return
    
    try:
        # Lê o arquivo
        print(f"\n📖 Lendo arquivo: {arquivo}")
        df = pd.read_excel(arquivo)
        
        print(f"✅ Sucesso! {len(df)} condomínios carregados.")
        print(f"\n📋 Colunas disponíveis: {list(df.columns)}")
        
        # Verifica colunas necessárias
        colunas_necessarias = ['nome']
        colunas_faltando = [c for c in colunas_necessarias if c not in df.columns]
        
        if colunas_faltando:
            print(f"⚠️  Colunas faltando: {colunas_faltando}")
            print("   Usando primeira coluna como nome...")
            nome_col = df.columns[0]
        else:
            nome_col = 'nome'
        
        # Contatos conhecidos
        contatos_conhecidos = {
            'Abitare Eco Clube': '(11) 4525-4500',
            'Condomínio Garden Resort': '(11) 4582-2282',
            'Kaza Condomínio Club': '(11) 4589-9000',
            'Vittá Condomínio Clube': '(11) 4582-7100',
            'Veduta Residencial': '(11) 4589-7900',
            'Condomínio Infinity Top Living': '(11) 4525-9444'
        }
        
        # Processa cada condomínio
        resultados = []
        print("\n🔍 ANALISANDO CONDOMÍNIOS:")
        print("-"*60)
        
        for i, linha in df.iterrows():
            nome = str(linha[nome_col]) if pd.notna(linha[nome_col]) else f"Condomínio {i+1}"
            
            # Verifica se tem bairro
            bairro = ""
            if 'bairro' in df.columns and pd.notna(linha['bairro']):
                bairro = str(linha['bairro'])
            
            # Verifica contato conhecido
            telefone = ""
            for nome_conhecido, tel in contatos_conhecidos.items():
                if nome_conhecido in nome or nome in nome_conhecido:
                    telefone = tel
                    break
            
            # Status
            status = "✅ COM CONTATO" if telefone else "🔍 SEM CONTATO"
            
            # Adiciona ao resultado
            resultados.append({
                'Número': i + 1,
                'Condomínio': nome,
                'Bairro': bairro,
                'Telefone': telefone,
                'Status': status,
                'Termo de Busca': f'"{nome}" Jundiaí telefone'
            })
            
            # Mostra progresso
            nome_display = nome[:40] + "..." if len(nome) > 40 else nome
            print(f"{i+1:3d}. {nome_display:45} {status}")
        
        # Cria DataFrame de resultados
        df_resultados = pd.DataFrame(resultados)
        
        # Salva em Excel
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_excel = f'resultados_condominios_{timestamp}.xlsx'
        df_resultados.to_excel(output_excel, index=False)
        
        # Estatísticas
        total = len(resultados)
        com_contato = len([r for r in resultados if r['Telefone']])
        sem_contato = total - com_contato
        
        print("\n" + "="*60)
        print("📈 RELATÓRIO FINAL")
        print("="*60)
        print(f"Total analisado: {total}")
        print(f"Com contato: {com_contato} ({com_contato/total*100:.1f}%)")
        print(f"Sem contato: {sem_contato} ({sem_contato/total*100:.1f}%)")
        print(f"\n📁 Arquivo salvo: {output_excel}")
        
        # Mostra contatos encontrados
        if com_contato > 0:
            print("\n✅ CONTATOS ENCONTRADOS:")
            for r in resultados:
                if r['Telefone']:
                    print(f"   • {r['Condomínio'][:40]:40} - {r['Telefone']}")
        
        # Sugestões para sem contato
        if sem_contato > 0:
            print(f"\n🔍 SUGESTÕES PARA {sem_contato} SEM CONTATO:")
            print("   1. Use o Google Maps com o endereço")
            print("   2. Busque no site Sindiconet.com.br")
            print("   3. Consulte imobiliárias locais")
            print("   4. Verifique redes sociais")
        
        print("\n" + "="*60)
        print("🎉 ANÁLISE CONCLUÍDA COM SUCESSO!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()

# Executa direto
if __name__ == "__main__":
    analisar_condominios()