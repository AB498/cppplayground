
#include <fstream>
#include <set>
#include <unordered_set>
#include <unordered_map>
#include <stack>
#include <queue>
#include <cstdarg>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <iostream>
#include <memory>


// Check if <tuple> is available
#if __has_include(<tuple>)
    #include <tuple>
    #define TUPLE_AVAILABLE 1
#else
    #define TUPLE_AVAILABLE 0
#endif



std::string _special_print(std::string str, int lineNum, int col, std::string filename = R"({{filename}})")
{
    if(filename == "" || filename == "{{filename}}") {
        std::cout << "__res_start__" + std::to_string(lineNum) + "_" + std::to_string(col) + "__";
        std::cout << str;
        std::cout << "__res_end__" + std::to_string(lineNum) + "_" + std::to_string(col) + "__";
        return str;
    } else {

        std::ofstream outFile(filename, std::ios::app);
        if (!outFile) {
            throw std::runtime_error("Unable to open file: " + filename);
        }
        outFile << "__res_start__" + std::to_string(lineNum) + "_" + std::to_string(col) + "__";
        outFile << str;
        outFile << "__res_end__" + std::to_string(lineNum) + "_" + std::to_string(col) + "__";
        outFile.close();

        return str;
    }
}



std::string strinfigy_auto(const std::string obj)
{
    return obj;
}
std::string strinfigy_auto(int obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(bool obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(uint8_t obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(uint16_t obj)
{
    return std::to_string(obj);
}
// unsigned int avaible for uint32_t

std::string strinfigy_auto(float obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(double obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(short obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(long obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(long long obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(unsigned int obj)
{
    return std::to_string(obj);
}
// std::string strinfigy_auto(unsigned long obj)
// {
//     return std::to_string(obj);
// }
std::string strinfigy_auto(unsigned long int obj)
{
    return std::to_string(obj);
}
std::string strinfigy_auto(unsigned long long obj)
{
    return std::to_string(obj);
}

// std::string strinfigy_auto(size_t obj)
// {
//     return std::to_string(obj);
// }



#if TUPLE_AVAILABLE
template<typename Type, unsigned N, unsigned Last>
struct tuple_printer {

    static void print(std::ostream& out, const Type& value) {
        out << std::get<N>(value) << ", ";
        tuple_printer<Type, N + 1, Last>::print(out, value);
    }
};

template<typename Type, unsigned N>
struct tuple_printer<Type, N, N> {

    static void print(std::ostream& out, const Type& value) {
        out << std::get<N>(value);
    }

};

template<typename... Types>
std::string strinfigy_auto(const std::tuple<Types...>& value) {
    std::ostringstream out;
    out << "(";
    tuple_printer<std::tuple<Types...>, 0, sizeof...(Types) - 1>::print(out, value);
    out << ")";
    return out.str();
}

#endif

















template <typename K, typename V>
std::string strinfigy_auto(const std::pair<K, V>& p)
{
    std::ostringstream os;
    os << "(" << strinfigy_auto(p.first) << ", " << strinfigy_auto(p.second) << ")";
    return os.str();
}

template <typename T>
std::string strinfigy_auto(const T &obj, typename std::enable_if<!std::is_convertible<T, std::string>::value>::type * = nullptr)
{
    return " [Object] ";
}

std::string strinfigy_auto(const char *value)
{
    return strinfigy_auto(std::string(value));
}



std::string strinfigy_auto(char obj)
{
    return std::string(1, obj);
}





















template <typename... Args>
std::string strinfigy_auto(std::map<Args...> obj);
template <typename... Args>
std::string strinfigy_auto(std::vector<Args...> obj);

template <typename... Args>
std::string strinfigy_auto(std::vector<Args...> obj)
{
    std::ostringstream os;
    os << "[";
    for (auto it = obj.begin(); it != obj.end(); it++)
    {
        os << strinfigy_auto(*it);
        if (it != std::prev(obj.end()))
            os << ", ";
    }
    os << "]";
    return os.str();
}

template <typename T, std::size_t N>
std::string strinfigy_auto(const T (&array)[N])
{
    std::ostringstream os;
    os << "[";
    for (std::size_t i = 0; i < N; ++i)
    {
        os << strinfigy_auto(array[i]);
        if (i != N - 1)
            os << ", ";
    }
    os << "]";
    return os.str();
}






template <typename... Args>
std::string strinfigy_auto(std::priority_queue<Args...> obj)
{
    std::ostringstream os;
    os << "[";
    std::priority_queue<Args...> temp = obj;
    while (!temp.empty())
    {
        os << strinfigy_auto(temp.top());
        temp.pop();
        if (!temp.empty())
            os << ", ";
    }
    os << "]";
    return os.str();
}
template <typename... Args>
std::string strinfigy_auto(std::queue<Args...> obj)
{
    std::ostringstream os;
    os << "[";
    while (!obj.empty())
    {
        os << strinfigy_auto(obj.front());
        obj.pop();
        if (!obj.empty())
            os << ", ";
    }
    os << "]";
    return os.str();
}
template <typename... Args>
std::string strinfigy_auto(std::stack<Args...> obj)
{
    std::ostringstream os;
    os << "[";
    while (!obj.empty())
    {
        os << strinfigy_auto(obj.top());
        obj.pop();
        if (!obj.empty())
            os << ", ";
    }
    os << "]";
    return os.str();
}
template <typename... Args>
std::string strinfigy_auto(std::set<Args...> obj)
{
    std::ostringstream os;
    os << "{";
    for (auto it = obj.begin(); it != obj.end(); it++)
    {
        os << strinfigy_auto(*it);
        if (it != prev(obj.end()))
            os << ", ";
    }
    os << "}";
    return os.str();
}
template <typename... Args>
std::string strinfigy_auto(std::unordered_set<Args...> obj)
{
    std::ostringstream os;
    os << "{";
    for (auto it = obj.begin(); it != obj.end(); it++)
    {
        os << strinfigy_auto(*it);
        if (it != obj.end())
            os << ", ";
    }
    os << "}";
    return os.str();
}

template <typename... Args>
std::string strinfigy_auto(std::unordered_map<Args...> obj)
{
    std::ostringstream os;
    os << "{";
    for (auto it = obj.begin(); it != obj.end(); it++)
    {
        os << strinfigy_auto(it->first) << ": " << strinfigy_auto(it->second);
        if (it != obj.end())
            os << ", ";
    }
    os << "}";
    return os.str();
}

template <typename... Args>
std::string strinfigy_auto(std::multiset<Args...> obj)
{
    std::ostringstream os;
    os << "{";
    for (auto it = obj.begin(); it != obj.end(); it++)
    {
        os << strinfigy_auto(*it);
        if (it != std::prev(obj.end()))
            os << ", ";
    }
    os << "}";
    return os.str();
}
template <typename... Args>
std::string strinfigy_auto(std::map<Args...> obj)
{
    std::ostringstream os;
    os << "{";
    for (auto it = obj.begin(); it != obj.end(); it++)
    {
        os << strinfigy_auto(it->first) << ": " << strinfigy_auto(it->second);
        if (it != prev(obj.end()))
            os << ", ";
    }
    os << "}";
    return os.str();
}


int _conv_string(int value, int lineNum = 0, int col = 0)
{
    std::string s = strinfigy_auto(value);
    _special_print(s, lineNum, col);
    return value;
}
template <typename T>
T _conv_string(T value, int lineNum = 0, int col = 0)
{
    std::string s = strinfigy_auto(value);
    _special_print(s, lineNum, col);
    return value;
}
template <typename T>
T _conv_string(int value, int lineNum = 0, int col = 0)
{
    std::string s = strinfigy_auto(value);
    _special_print(s, lineNum, col);

    return value;
}
template <typename T>
T _conv_string(std::string value, int lineNum = 0, int col = 0)
{
    std::string s = strinfigy_auto(value);
    _special_print(s, lineNum, col);

    return value;
}
int _special_printf(int lineNum, int col, const char *format, ...)
{
    va_list args1, args2;
    va_start(args1, format);

    // Calculate size and format into dynamic buffer
    int size = vsnprintf(nullptr, 0, format, args1) + 1;
    std::unique_ptr<char[]> buffer(new char[size]);
    vsprintf(buffer.get(), format, args1);

    va_end(args1);

    std::string str1 = std::string(buffer.get());
    _special_print(str1, lineNum, col);

    va_start(args2, format);
    int printedChars = vprintf(format, args2); // Print to stdout
    va_end(args2);

    return printedChars;
};
