module.exports = function remark() {
  return {
    parse: async (text) => {
      return {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: text }]
          }
        ]
      };
    }
  };
}; 