        fetch('components/nav.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('nav-placeholder').innerHTML = data;
            })
            .catch(err => console.error('載入導覽列失敗:', err));