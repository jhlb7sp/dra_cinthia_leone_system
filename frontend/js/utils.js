// Capitaliza a primeira letra de cada palavra
function capitalizarNome(nome) {
  return nome
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

// Exporta a função (se estiver usando módulos ES6)
// export { capitalizarNome };
