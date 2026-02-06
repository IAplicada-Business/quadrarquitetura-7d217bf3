

# Remover opção de criar conta na tela de Login

## Objetivo
Remover completamente a funcionalidade de registro/criação de conta da página de login. Apenas administradores poderão criar contas internamente no futuro.

## Alterações

### 1. Página de Login (`src/pages/Login.tsx`)
- Remover o estado `isLogin` (sempre será login)
- Remover o estado `fullName` 
- Remover o campo "Nome completo" do formulário
- Remover a lógica de `signUp` do `handleSubmit`
- Remover o link "Não tem uma conta? Criar conta" no rodapé
- Simplificar o título para sempre mostrar "Bem-vindo(a) de volta"
- Simplificar o subtítulo para sempre mostrar "Acesse o sistema de gestão Quadra"
- Botão sempre exibe "Entrar"

### 2. Contexto de Auth (`src/contexts/AuthContext.tsx`)
- Manter a função `signUp` no contexto para uso futuro por administradores (criação interna de contas)
- Nenhuma alteração necessária neste arquivo

## Resultado
A tela de login ficará mais limpa e direta, com apenas os campos de e-mail e senha, sem nenhuma referência a criação de conta.

