// Глобальные переменные
let originalEncoded = "";  // Сохраняем оригинальный закодированный код
let controlBitPositions = [];  // Позиции контрольных битов (начиная с 1)
let dataLength = 0;  // Длина исходных данных

// Проверка ввода (только 0 и 1)
function checkBinary(e) {
    const key = e.keyCode || e.which;
    const char = String.fromCharCode(key);
    
    // Разрешаем только 0, 1 и управляющие клавиши
    if (!['0', '1'].includes(char) && 
        ![8, 46, 37, 38, 39, 40].includes(key)) {
        e.preventDefault();
        return false;
    }
    return true;
}

// Проверка является ли число степенью двойки
function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

// Вычисление контрольных битов
function calculateControlBits(dataBits) {
    let r = 0;
    // Формула: 2^r >= m + r + 1, где m - количество бит данных
    while (Math.pow(2, r) < dataBits + r + 1) {
        r++;
    }
    return r;
}

// Кодирование по Хэммингу
function encodeHamming() {
    const input = document.getElementById('inputData').value.trim();
    
    // Проверка ввода
    if (!input) {
        alert('Пожалуйста, введите двоичную последовательность!');
        return;
    }
    
    // Проверка что ввод содержит только 0 и 1
    if (!/^[01]+$/.test(input)) {
        alert('Ввод должен содержать только символы 0 и 1!');
        return;
    }
    
    dataLength = input.length;
    const controlBitsCount = calculateControlBits(dataLength);
    const totalBits = dataLength + controlBitsCount;
    
    // Создаем массив для результата
    const encoded = new Array(totalBits).fill(0);
    controlBitPositions = [];
    
    // Заполняем позиции контрольных битов
    for (let i = 0; i < totalBits; i++) {
        if (isPowerOfTwo(i + 1)) {
            controlBitPositions.push(i + 1);
        }
    }
    
    // Заполняем данными (пропуская позиции контрольных битов)
    let dataIndex = 0;
    for (let i = 1; i <= totalBits; i++) {
        if (!isPowerOfTwo(i)) {
            encoded[i - 1] = parseInt(input[dataIndex]);
            dataIndex++;
        }
    }
    
    // Вычисляем значения контрольных битов
    for (let i = 0; i < controlBitsCount; i++) {
        const controlPos = Math.pow(2, i) - 1;
        let xor = 0;
        
        // Проверяем все биты, у которых в битовой позиции i стоит 1
        for (let j = controlPos + 1; j <= totalBits; j++) {
            if (j & (1 << i)) {
                xor ^= encoded[j - 1];
            }
        }
        
        encoded[controlPos] = xor;
    }
    
    // Сохраняем результат
    originalEncoded = encoded.join('');
    document.getElementById('encodedData').value = originalEncoded;
    document.getElementById('decodedData').value = '';
    document.getElementById('resultMessage').innerHTML = '';
    
    // Обновляем информацию
    updateInfo(encoded);
    
    // Визуализируем биты
    visualizeBits(encoded, null);
}

// Декодирование по Хэммингу
function decodeHamming() {
    const input = document.getElementById('encodedData').value.trim();
    
    if (!input) {
        alert('Нет данных для декодирования!');
        return;
    }
    
    if (!/^[01]+$/.test(input)) {
        alert('Ввод должен содержать только символы 0 и 1!');
        return;
    }
    
    const bits = input.split('').map(bit => parseInt(bit));
    const totalBits = bits.length;
    
    // Вычисляем синдром ошибки
    let errorPosition = 0;
    
    for (let i = 0; i < controlBitPositions.length; i++) {
        const controlPos = controlBitPositions[i] - 1;
        let xor = 0;
        
        // Считаем XOR для всех битов, контролируемых этим контрольным битом
        for (let j = 1; j <= totalBits; j++) {
            if (j & (1 << i)) {
                xor ^= bits[j - 1];
            }
        }
        
        // Если XOR не равен 0, добавляем позицию контрольного бита
        if (xor !== 0) {
            errorPosition += Math.pow(2, i);
        }
    }
    
    // Извлекаем исходные данные
    let decodedData = '';
    for (let i = 1; i <= totalBits; i++) {
        if (!isPowerOfTwo(i)) {
            decodedData += bits[i - 1];
        }
    }
    
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.innerHTML = '';
    
    // Анализируем результат
    if (errorPosition === 0) {
        // Нет ошибок
        document.getElementById('decodedData').value = decodedData;
        resultMessage.innerHTML = '<div class="success">✓ Ошибок не обнаружено</div>';
        visualizeBits(bits, null);
    } else if (errorPosition <= totalBits) {
        // Одна ошибка - исправляем
        bits[errorPosition - 1] = bits[errorPosition - 1] ^ 1;  // Инвертируем бит
        
        // Извлекаем исправленные данные
        let correctedData = '';
        for (let i = 1; i <= totalBits; i++) {
            if (!isPowerOfTwo(i)) {
                correctedData += bits[i - 1];
            }
        }
        
        document.getElementById('decodedData').value = correctedData;
        resultMessage.innerHTML = `<div class="error">1 ошибка: бит №${errorPosition}</div>`;
        visualizeBits(bits, errorPosition - 1);
    } else {
        // Две и более ошибок
        document.getElementById('decodedData').value = '';
        resultMessage.innerHTML = '<div class="error">2 и более ошибок. Невозможно восстановить</div>';
        visualizeBits(bits, null);
    }
}

// Визуализация битов
function visualizeBits(bits, errorBitIndex) {
    const container = document.getElementById('bitsVisualization');
    container.innerHTML = '';
    
    bits.forEach((bit, index) => {
        const bitElement = document.createElement('div');
        bitElement.className = 'bit';
        bitElement.textContent = bit;
        
        // Подписываем позицию
        const position = document.createElement('div');
        position.style.fontSize = '10px';
        position.style.color = '#666';
        position.textContent = index + 1;
        
        // Размечаем контрольные биты
        if (isPowerOfTwo(index + 1)) {
            bitElement.classList.add('control-bit');
        }
        
        // Подсвечиваем ошибочный бит
        if (index === errorBitIndex) {
            bitElement.classList.add('error-bit');
        }
        
        // Подсвечиваем исправленный бит
        if (errorBitIndex !== null && index === errorBitIndex) {
            bitElement.style.backgroundColor = '#c8e6c9';
            bitElement.style.color = '#388e3c';
        }
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.appendChild(position);
        wrapper.appendChild(bitElement);
        
        container.appendChild(wrapper);
    });
}

// Обновление информации
function updateInfo(encoded) {
    document.getElementById('controlBitsPositions').textContent = 
        controlBitPositions.join(', ');
    document.getElementById('originalLength').textContent = dataLength;
    document.getElementById('encodedLength').textContent = encoded.length;
}