body {
    font-family: 'Cairo', Tahoma, sans-serif;
    margin: 0;
    background-color: #f4f4f4;
    color: #333;
}

.about-section {
    padding: 50px;
    text-align: center;
    background-color: #2c3e50;
    color: white;
}

.container {
    padding: 20px;
    max-width: 1100px;
    margin: auto;
}

.row:after {
    content: "";
    display: table;
    clear: both;
}

.column {
    float: right;
    width: 50%;
    padding: 10px;
    box-sizing: border-box;
}

.card {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    text-align: center;
}

.container-card {
    padding: 0 16px 16px 16px;
}

.title {
    color: grey;
}

@media screen and (max-width: 650px) {
    .column {
        width: 100%;
    }
}
