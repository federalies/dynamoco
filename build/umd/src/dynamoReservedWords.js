(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const base64toBuff = (s) => Buffer.from(s, 'base64');
    exports.reservedWords = (decompressSync) => {
        const reservedWordCompressedBuff = base64toBuff('GyYQAIzUWg2v7UaodChVyfptO8aeWIvTmX6RCuBXf4rf7nUjNsnxvhGcrCRtD6fmf/e007lQYZ6xAlYAcyfJrqQMjyjDI0N2' +
            '/GNMAAtTFvgAlhbN6czcAUk7EX8ODEYbkdrwds1bEUeyRS7839a8vaAWp9rZUO0CLezku9ZyVtOnZG2v0G2+/+Gn1Cs9ggGI' +
            'eSu+amXiwKiHNcxi6I0K7ujn6/1+0bKrSU05R90OHwnTbHjS2q2RppL+xYbZEEHfgrT2XPq3YeLdvaNbINUxJMcwoHcZUnH4' +
            'eR2+jL6D4Au9wcyDuJx5uZKGeoSGjkWL8e0fZDwn4m9rcWMeObNP+My4hHMMcaaOCIIICCrV0pz4mXwEdXiTJ/hHrMiQe3kw' +
            'LkzmZKvWCN8yrvjtkmdL6sA8c4Zc6AVXw11tz5kqiZGMuvcFLW2jJ9xeczK7qBJjclmwyuj1G2ut/pZyNTjevuzwYq8YpbLP' +
            'tndS70kkT9vYvfsH297cr74hW4rbmaYISgNj8E9mlXwfmG8u0EwqKXrnFRahMJhmdDoL5InRr4Jzei9wqRGN2fQMYuoZH+BU' +
            '8TGZe0SIDRIbRI8wqiEykMl2LIVTDWaS068j9JYP5t3dyagVPopPw6/harvC7boTtRLYtOfuxdpHynVqoOI2Ers0RZGm/zHk' +
            '8t7MwpVbsWdHkWcZJh2yp74FTHjkSfUsXDhOMVKH6tjRpOMUdDUd+yX+6KIkUmYRpuKPWUDam61/DnoQHbXb93mh1ks408M+' +
            'PvG2au3qkpJUeCYxl8FAsgVNXRaINYl3eUdOrPDWP3NDlWZh0ikXNIWOIa2Wh70EcUObGJf4sdE819RNVsP4EMEMrQTqhdmk' +
            'M9n2DqQZ1x1735DkWh52b6C56HYuZ7ZzivXanquSMMzMuwKLpGvm4XEkz4KL0yvQUuUZ0ijvnXDTmQbPwAKguvBAVkxpW2o0j' +
            '+tf5om+mwLUZt3369U4Na47iVF9g5GjvD0gUHFq75YfXrKYoMNIgWzTliLyiZpnDyVJLjl1jKwbEExjYHDDLtmxmbdw8tlz63' +
            'JhANltWrhqKbV9cIqFdw7+Ii1LG0AAX26jNCqvOZMhZkOUkxMAf8lb649vsaKUcYmnO7EMurhaGllPKmkRAuNK3QdGZ0uoZ3C' +
            '3SnkPqfQf0bRcHqE0KFxmM1sw8kiXtic9G/e8LEJwGrykyU/h5eIKLgGBXrHmmf9CzdjKdAxhgo/wj9CMTzqBpJGGNOWFCRF9' +
            'YMOyl6YBf1eOhck3rTUzIPApn+7VEW8wd5Kgh0DOadhUSIiJr5UgzFHepnWPEZQx83B5w/inhTQXaJGEnbO4PuPd+QOnoF0iS' +
            'je1Tk38TgN9upBWnlrQwjRg3qu14//uLSDAdYgT7QV5yJOZNiJvjKmlAe1Ead0KHoR4BvDHmNTcsvLvLge23htqR2gHIyc52z' +
            'cRjKI8bbcsZG/Y/jUi87JYQyJtW2XAiZGi77WLStubmZ/essYMwMyVpdqt6YW7epDH2JaVumTyVGPhLYZ9TwgDh68I/J36u1U' +
            'EOR2Yz7wgdvWK6NtT45JW1WC+RPEOJkbv5OKeopgHBDizvIiLf7joFWnREIXjSTjbQaEnm/7mFdMEie2on0J231MrFVPjkhLb' +
            'SNML9OrLAojHMqCVeTNGH2eAmOHYVpLc3iUT5BroF2mFrztSqPRlY3xHRZ10etnbvZ3hgTbv2LiqKmmljUryD+N7nxQzKaJcz' +
            'G9iMnf3DuO3DFy81aISdxKrJbW1QZNy/Xqg/+AIPfwT1RHoDmawmRvDRRelSDbwridOchozsbatMS/Xibf4b+ibtutti3q+bJj' +
            '4yur6KIhjDqhWba1Qe3GpRvDMp0AFyYZ6dRQzUbih5L8pcx/ev/xGTqNVd+waKVVO7LRo1RMtUZ6xMJh8O5/rVxpMvlb9m5U+M' +
            'sgm4Uo6624MDpioDkEmGrehatHJReHbXbxLenGTKXO3Q9Vem54zLnN7L3wnVvtIrCtR7LevGDBnm4OK7nF3z3JgQz3sYsqVF6UL' +
            'ty8d56TFzhKzYj4i9i/qzuhfhQiJT0sjIA0gxbqTZ0s3UfatE+l99pfAZLxGS2kc/2BNRSbG7WPhipHGBYV6RGpT7tPxwxmCrad' +
            'Hk3TxxgIn9navfBwbmOwp7QOz8X2wGyfs4qnACwj+7+5KUssbnEoNDt69qeaeK7NFN8rX7dJ2SlNvoHgWHXIK9R8ykiQjLxrG9Y5' +
            '7hJ7wfU+PcndbDHu8JG/orH8eQKeXcMRoaWdesND9Laokm/nn9OQIvTGkd4CG5oFySZI6MfnAwX0N7xvWzXtGI/mZt2I/RL7Rwr406swB');
        const bufOpen = decompressSync(reservedWordCompressedBuff);
        const words = bufOpen.toString().split('\n');
        return words.reduce((p, w) => (Object.assign(Object.assign({}, p), { [w]: true })), {});
    };
});
