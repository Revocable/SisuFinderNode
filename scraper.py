import json
import requests
import os

# Função para obter o json do link com o id
def obter_json_com_id(id):
    url = f'https://sisu-api.sisu.mec.gov.br/api/v1/arquivo/{id}/chamada_regular'
    print(f'Acessando a URL: {url}')  # Adicionando depuração
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao acessar a URL para o id {id}. Status code: {response.status_code}")
        return None

# Função para baixar o arquivo CSV
def baixar_csv(url, id):
    print(f'Obtendo CSV de: {url}')  # Adicionando depuração
    response = requests.get(url)
    if response.status_code == 200:
        os.makedirs('csv', exist_ok=True)  # Cria a pasta "csv" se não existir
        caminho_arquivo = f'csv/{id}.csv'
        with open(caminho_arquivo, 'wb') as f:
            f.write(response.content)
        print(f'Arquivo CSV para o id {id} salvo com sucesso!')
    else:
        print(f"Erro ao baixar o CSV para o id {id}. Status code: {response.status_code}")

# Abre o arquivo JSON
try:
    with open('arquivo.json', 'r') as f:
        data = json.load(f)
    print("Arquivo JSON carregado com sucesso!")
except Exception as e:
    print(f"Erro ao abrir o arquivo JSON: {e}")
    exit(1)

# Verificando se o campo 'co_ies' está presente
valores_co_ies = [item['co_ies'] for item in data if 'co_ies' in item]

if not valores_co_ies:
    print("Nenhum valor encontrado para o campo 'co_ies'.")
    exit(1)

# Para cada id na lista de valores_co_ies, obtém a URL do CSV e faz o download
for id in valores_co_ies:
    json_data = obter_json_com_id(id)
    if json_data:
        # A resposta parece ser uma lista, então verificamos se a lista contém dados
        if isinstance(json_data, list) and len(json_data) > 0:
            # Extraímos o primeiro item da lista, que contém o campo "ds_caminho_arquivo"
            arquivo_data = json_data[0]
            if 'ds_caminho_arquivo' in arquivo_data:
                url_csv = arquivo_data['ds_caminho_arquivo']
                baixar_csv(url_csv, id)
            else:
                print(f"Campo 'ds_caminho_arquivo' não encontrado para o id {id}.")
        else:
            print(f"Nenhuma informação encontrada para o id {id}.")
    else:
        print(f"Não foi possível obter dados para o id {id}.")
